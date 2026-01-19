const fs = require('fs');
const path = require('path');

async function copyDir(src, dest) {
  const entries = await fs.promises.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await fs.promises.mkdir(destPath, { recursive: true });
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}

async function replacePlaceholders(root, projectName) {
  const textExts = new Set([
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '.json',
    '.md',
    '.markdown',
    '.html',
    '.htm',
    '.css',
    '.scss',
    '.less',
    '.txt',
    '.yml',
    '.yaml',
    '.xml',
    '.toml',
    '.ini',
    '.properties',
  ]);
  const nameWhitelist = new Set([
    'Dockerfile',
    'Makefile',
    '.gitignore',
    '.gitattributes',
    'LICENSE',
    'README',
    'README.md',
    '.env',
    'package.json',
  ]);
  const skipDirs = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.venv']);

  const entries = await fs.promises.readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const p = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      await replacePlaceholders(p, projectName);
      continue;
    }

    if (!entry.isFile()) continue;

    const base = entry.name;
    const ext = path.extname(base).toLowerCase();

    // Only process known text files or whitelisted filenames
    if (!textExts.has(ext) && !nameWhitelist.has(base)) continue;

    try {
      let content = await fs.promises.readFile(p, 'utf8');
      if (content.indexOf('__PROJECT_NAME__') !== -1) {
        content = content.split('__PROJECT_NAME__').join(projectName || '__PROJECT_NAME__');
        await fs.promises.writeFile(p, content, 'utf8');
      }
    } catch (err) {
      // ignore read/write errors (binary files, encoding issues, etc.)
    }
  }
}

// Generate from an explicit list of items: [{ src, dest }, ...]
// dest is a relative folder inside the generated project. If dest === '' copy into project root.
async function generateFromList({
  items,
  projectName,
  destRoot,
  createRootPkg = false,
  force = false,
}) {
  const projectDest = path.join(destRoot, projectName || 'project');

  // If destination exists and is non-empty, refuse unless force=true
  const exists = await existsPath(projectDest);
  if (exists) {
    const notEmpty = !(await isDirEmpty(projectDest));
    if (notEmpty && !force) {
      throw new Error(
        `Destination ${projectDest} existe et n'est pas vide. Utilisez --force pour écraser.`,
      );
    }
  } else {
    await fs.promises.mkdir(projectDest, { recursive: true });
  }

  // Preflight: detect file conflicts unless force
  if (!force) {
    for (const item of items) {
      const target = (item.dest || '').trim();
      const destPath = target ? path.join(projectDest, target) : projectDest;
      const conflicts = await findConflicts(item.src, destPath);
      if (conflicts.length > 0) {
        throw new Error(
          `Conflit de fichiers détecté : ${conflicts[0]}. Utilisez --force pour écraser.`,
        );
      }
    }
  }

  // perform copy (force allowed — copy will overwrite)
  for (const item of items) {
    const target = (item.dest || '').trim();
    const destPath = target ? path.join(projectDest, target) : projectDest;
    await fs.promises.mkdir(destPath, { recursive: true });
    await copyDir(item.src, destPath);
  }

  if (createRootPkg) {
    const workspaceNames = items.map(it => (it.dest || '').trim()).filter(Boolean);
    const rootPkg = {
      name: '__PROJECT_NAME__',
      version: '1.0.0',
      private: true,
      workspaces: workspaceNames,
    };
    await fs.promises.writeFile(
      path.join(projectDest, 'package.json'),
      JSON.stringify(rootPkg, null, 2),
      'utf8',
    );
  }

  await replacePlaceholders(projectDest, projectName);
  return projectDest;
}

async function existsPath(p) {
  try {
    await fs.promises.access(p);
    return true;
  } catch (e) {
    return false;
  }
}

async function isDirEmpty(dir) {
  try {
    const files = await fs.promises.readdir(dir);
    return files.length === 0;
  } catch (e) {
    return true;
  }
}

// findConflicts: return list of first conflicting destination file paths
async function findConflicts(srcRoot, destRoot) {
  const conflicts = [];
  async function walk(srcDir, rel = '') {
    const entries = await fs.promises.readdir(srcDir, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const relPath = path.join(rel, entry.name);
      const destPath = path.join(destRoot, relPath);
      if (entry.isDirectory()) {
        await walk(srcPath, relPath);
      } else if (entry.isFile()) {
        if (await existsPath(destPath)) {
          conflicts.push(destPath);
          return;
        }
      }
    }
  }
  await walk(srcRoot);
  return conflicts;
}

// Install an optional module: copy moduleSrc into projectDest/<moduleFolderName>
async function installModule({
  moduleSrc,
  projectDest,
  moduleFolderName = 'docker-dev',
  force = false,
  projectName,
}) {
  const moduleDest = path.join(projectDest, moduleFolderName);

  const exists = await existsPath(moduleDest);
  if (exists) {
    const notEmpty = !(await isDirEmpty(moduleDest));
    if (notEmpty && !force) {
      throw new Error(
        `Destination du module ${moduleDest} existe et n'est pas vide. Utilisez --force pour écraser.`,
      );
    }
  } else {
    await fs.promises.mkdir(moduleDest, { recursive: true });
  }

  // detect conflicts with existing files in moduleDest when not forcing
  if (!force) {
    const conflicts = await findConflicts(moduleSrc, moduleDest);
    if (conflicts.length > 0) {
      throw new Error(
        `Conflit lors de l'installation du module : ${conflicts[0]}. Utilisez --force pour écraser.`,
      );
    }
  }

  await copyDir(moduleSrc, moduleDest);
  await replacePlaceholders(moduleDest, projectName);
  return moduleDest;
}

// Install Docker module files into their respective app folders:
// - docker-compose.yml -> project root
// - frontend.Dockerfile -> frontend/Dockerfile or project root if frontend is at root
// - backend.Dockerfile -> backend/Dockerfile
async function installDockerModule({ moduleSrc, projectDest, force = false, projectName }) {
  // locate files in moduleSrc
  const files = await fs.promises.readdir(moduleSrc, { withFileTypes: true });
  // helper to copy and replace
  async function copyAndReplace(srcFile, destPath) {
    if ((await existsPath(destPath)) && !force) {
      throw new Error(`Fichier cible existe: ${destPath}. Utilisez --force pour écraser.`);
    }
    await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
    await fs.promises.copyFile(srcFile, destPath);
    await replacePlaceholders(path.dirname(destPath), projectName);
  }

  for (const entry of files) {
    if (!entry.isFile()) continue;
    const name = entry.name;
    const srcPath = path.join(moduleSrc, name);
    if (name === 'docker-compose.yml') {
      const dest = path.join(projectDest, 'docker-compose.yml');
      await copyAndReplace(srcPath, dest);
    } else if (/frontend\.Dockerfile$/i.test(name)) {
      // determine frontend location: projectDest/frontend if exists, else projectDest
      const frontendDir = path.join(projectDest, 'frontend');
      const frontendExists = await existsPath(frontendDir);
      const dest = frontendExists
        ? path.join(frontendDir, 'Dockerfile')
        : path.join(projectDest, 'Dockerfile');
      await copyAndReplace(srcPath, dest);
    } else if (/backend\.Dockerfile$/i.test(name)) {
      const backendDir = path.join(projectDest, 'backend');
      if (!(await existsPath(backendDir))) {
        if (!force)
          throw new Error(
            "Backend absent : impossible d'installer backend Dockerfile sans --force",
          );
        await fs.promises.mkdir(backendDir, { recursive: true });
      }
      const dest = path.join(backendDir, 'Dockerfile');
      await copyAndReplace(srcPath, dest);
    }
  }

  return projectDest;
}

module.exports = {
  copyDir,
  replacePlaceholders,
  generateFromList,
  // exported for use by CLI (checks for module copying)
  existsPath,
  isDirEmpty,
  findConflicts,
  installModule,
  installDockerModule,
};
