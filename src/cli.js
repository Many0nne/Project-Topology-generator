#!/usr/bin/env node
const { Command } = require('commander');
const readline = require('readline');
const templates = require('./templates');
const modules = require('./modules');
const generator = require('./generator');
const path = require('path');

const program = new Command();
program.name('create-my-app').description('Simple CLI');
program.option('-f, --force', 'Overwrite existing files / force generation');

program
  .command('init')
  .description('Initialize a new project')
  .action(async () => {
    console.log('CLI OK');

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (q) => new Promise((resolve) => rl.question(q, (ans) => resolve(ans)));

    const projectName = (await question('Nom du projet : ')).trim();

    // Basic project name validation (no path separators, not empty, not start with dot)
    if (!projectName || /[\\/\s]/.test(projectName) || projectName.startsWith('.')) {
      rl.close();
      console.error('Nom de projet invalide — éviter espaces, /, \\ et noms commençant par .');
      process.exit(1);
    }

    const opts = program.opts();
    const force = !!opts.force;

    console.log('\nType de projet ?');
    console.log('1) Frontend');
    console.log('2) Fullstack');
    const ans = await question('Choix (1/2) : ');

    let choice;
    if (ans.trim() === '1' || /frontend/i.test(ans)) choice = 'Frontend';
    else if (ans.trim() === '2' || /fullstack/i.test(ans)) choice = 'Fullstack';
    else choice = ans.trim();

    console.log(`Vous avez choisi: ${choice}`);

    if (choice === 'Frontend') {
      console.log('\nType de frontend ?');
      console.log('1) react-vite');
      const feAns = await question('Choix (1) : ');
      let feChoice = 'react-vite';
      if (/1|react/i.test(feAns)) feChoice = 'react-vite';

      const items = templates.frontend[feChoice];
      const destRoot = process.cwd();
      try {
        const dest = await generator.generateFromList({ items, projectName, destRoot, createRootPkg: false, force });
        console.log('Le dossier template frontend a été copié dans', dest);

        const addDockerAns = await question('\nAjouter Docker pour le dev ? (y/N) : ');
        if (/^y(es)?$/i.test(addDockerAns.trim())) {
          try {
            const moduleSrc = modules['docker-dev'].frontend;
            await generator.installDockerModule({ moduleSrc, projectDest: dest, variant: 'frontend', force, projectName });
            console.log('Module Docker-dev (frontend) installé dans le projet');
          } catch (err) {
            console.error('Échec de copie du module Docker :', err.message);
            process.exit(1);
          }
        }
      } catch (err) {
        console.error('Échec :', err.message);
        process.exit(1);
      }
      rl.close();
    } else if (choice === 'Fullstack') {
      console.log('\nType de frontend ?');
      console.log('1) react-vite');
      const feAns = await question('Choix (1) : ');
      let feChoice = 'react-vite';
      if (/1|react/i.test(feAns)) feChoice = 'react-vite';

      console.log('\nQuel backend ?');
      console.log('1) express');
      const beAns = await question('Choix (1) : ');
      let beChoice = 'express';
      if (/1|express/i.test(beAns)) beChoice = 'express';

      const addAuthAns = await question('\nAjouter l\'auth ? (y/N) : ');
      const withAuth = /^y(es)?$/i.test(addAuthAns.trim());
      const feKey = withAuth ? `${feChoice}-auth` : feChoice;
      const beKey = withAuth ? `${beChoice}-auth` : beChoice;

      const combinedKey = `${feKey}+${beKey}`;
      const items = templates.fullstack[combinedKey];
      if (!items) {
        console.error('Combinaison non supportée :', combinedKey);
        process.exit(1);
      }

      const destRoot = process.cwd();
      try {
        const projectDest = await generator.generateFromList({ items, projectName, destRoot, createRootPkg: true, force });
        console.log('Le monorepo (frontend + backend) a été copié dans', projectDest);

        const addDockerAns = await question('\nAjouter Docker pour le dev ? (y/N) : ');
        if (/^y(es)?$/i.test(addDockerAns.trim())) {
          try {
            let moduleSrc = withAuth ? modules['docker-dev'].fullstackAuth : modules['docker-dev'].fullstack;
            if (withAuth) {
              const addAdminAns = await question('\nAjouter le panneau admin (pgAdmin) ? (y/N) : ');
              if (/^y(es)?$/i.test(addAdminAns.trim())) {
                moduleSrc = modules['docker-dev'].fullstackAuthAdmin;
              }
            }
            await generator.installDockerModule({ moduleSrc, projectDest, variant: 'fullstack', force, projectName });
            console.log('Module Docker-dev (fullstack) installé dans le projet');
          } catch (err) {
            console.error('Échec de copie du module Docker :', err.message);
            process.exit(1);
          }
        }
      } catch (err) {
        console.error('Échec :', err.message);
        process.exit(1);
      }
      rl.close();
    } else {
      rl.close();
      console.log('Choix non reconnu, rien fait.');
    }
  });

program.parse(process.argv);

module.exports = program;
