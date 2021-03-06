import * as path from 'path';
import {Promise} from 'es6-promise';
import Generator from '../../models/generator';
import Repository from '../repository/index';
import Service from '../service/index';
import ViewControl from '../viewcontrol/index';
import Cordova from '../cordova/index';

let validate: any = require('validate-npm-package-name');

export default class AppGenerator extends Generator {
    options: IOptions;
    protected title: string;

    defineOptions(): void {
        this.option('name', {
            aliases: ['n'],
            description: `The name of the app`
        });

        this.option('dir', {
            aliases: ['d'],
            description: `Specify the relative path to a directory in which to create the app`,
            defaults: ''
        });

        this.option('cordova', {
            description: `Don't create a cordova app`,
            defaults: true
        });

        this.option('gitignore', {
            description: `Don't create a .gitignore`,
            defaults: true
        });
    }

    askQuestions(): any {
        let options = this.options;

        return this.promptName(options.name).then((name) => {
            options.name = name;

            if (this.utils.isEmpty(options.dir)) {
                name = this.utils.camelCase(name).toLowerCase();
            }

            return this.promptDir(options.dir, name);
        }).then((dir) => {
            options.dir = dir;
            return this.promptCordova(options.cordova);
        }).then((cordova) => {
            options.cordova = cordova;
            return this.promptGitIgnore(options.gitignore);
        }).then((gitignore) => {
            options.gitignore = gitignore;
        });
    }

    promptCordova(cordova: boolean): Thenable<boolean> {
        if (!cordova) {
            return Promise.resolve(cordova);
        }

        return this.ui.prompt([
            { name: 'cordova', default: true, type: 'confirm', message: `Should we create a Cordova project?` }
        ]).then((answer: { cordova: boolean; }) => {
            return answer.cordova;
        });
    }

    promptGitIgnore(gitignore: boolean): Thenable<boolean> {
        if (!gitignore) {
            return Promise.resolve(gitignore);
        }

        return this.ui.prompt([
            { name: 'gitignore', default: true, type: 'confirm', message: `Should we create a .gitignore?` }
        ]).then((answer: { gitignore: boolean; }) => {
            return answer.gitignore;
        });
    }

    promptName(name: string = ''): Thenable<string> {
        name = name.trim();

        if (!this.utils.isEmpty(name)) {
            this.title = name;

            name = this.utils.kebabCase(name).toLowerCase();
            let valid = validate(name);

            if (this.utils.isArray(valid.errors) || this.utils.isArray(valid.warnings)) {
                this.ui.warn('');
                this.utils.forEach(valid.errors, (err: string) => {
                    this.ui.warn(err);
                });

                this.utils.forEach(valid.warnings, (err: string) => {
                    this.ui.warn(err);
                });
                this.ui.warn('');
            } else {
                return Promise.resolve(name);
            }
        }

        return this.ui.prompt([
            { name: 'name', type: 'input', message: `What is the name of your app?` }
        ]).then((answer: { name: string; }) => {
            return this.promptName(answer.name);
        });
    }

    promptDir(dir: string = '', defaults?: string): Thenable<string> {
        dir = dir.trim();

        if (!this.utils.isEmpty(dir)) {
            return Promise.resolve(dir);
        }

        return this.ui.prompt([
            { name: 'dir', default: defaults, type: 'input', message: `Where should this app be created?` }
        ]).then((answer: { dir: string; }) => {
            return answer.dir;
        });
    }

    run(): any {
        this.destRoot(this.options.dir + '/app');
        this.project.root = this.options.dir;
        this.ui.debug('Generating the `default` app');

        let destRoot = path.resolve(this.destRoot(), '..'),
            genOptions = {
                env: this.env,
                directory: this.directory,
                destRoot: destRoot
            },
            name = this.options.name,
            vcGenerator = this.instantiate(ViewControl, genOptions),
            repoGenerator = this.instantiate(Repository, genOptions),
            svcGenerator = this.instantiate(Service, genOptions),
            cordovaGenerator = this.instantiate(Cordova, genOptions),
            vcName = 'home',
            title = this.utils.startCase(this.title),
            options = {
                appName: name,
                appTitle: title,
                vcName: vcName
            };

        cordovaGenerator.options = {
            id: name,
            name: title
        };

        let promises: Array<Thenable<any>> = [
            this.render('package.json', '../package.json', options),
            this.render('README.md', '../README.md', options),
            this.render('tsconfig.json', '../tsconfig.json', options),
            this.render('index.html', 'index.html', options),
            this.file.copy(this.srcRoot() + '/favicon.ico', this.destRoot() + '/favicon.ico'),
            this.render('main.ts', 'src/main.ts', options),
            this.render('server.ts', '../server/server.ts', options),
            this.render('app/app.ts', 'src/app/app.ts', options),
            this.render('styles/main.less', 'styles/main.less', options),
            this.render('model/models.d.ts', 'src/models/models.d.ts', options),
            this.mkdirDest(
                'src/attributecontrols',
                'src/injectables',
                'src/templatecontrols',
                'lib',
                'fonts',
                'images',
                '../test/unit'
                )
        ];

        if (this.options.gitignore) {
            promises.push(this.render('gitignore', '../.gitignore', options));
        }

        repoGenerator.options = svcGenerator.options = {
            name: 'base',
            extends: false
        };

        return Promise.all(promises)
            .then(() => {
                vcGenerator.options = {
                    name: vcName,
                    less: true,
                    html: true
                };

                return vcGenerator.run();
            }).then(() => {
                vcGenerator.options = {
                    name: 'base',
                    extends: false,
                    register: false,
                    less: false,
                    html: false
                };

                return vcGenerator.run();
            }).then(() => {
                return repoGenerator.run();
            }).then(() => {
                return svcGenerator.run();
            }).then(() => {
                if (this.options.cordova) {
                    return cordovaGenerator.run();
                }
            });
    }
}

interface IOptions extends models.IParsedArgs {
    name: string;
    dir: string;
    cordova: boolean;
    gitignore: boolean;
}
