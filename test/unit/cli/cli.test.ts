/// <reference path="../../references.d.ts" />

import {use, expect} from 'chai';
import Cli from '../../../src/cli/cli';
import getCreate from '../mock/create.mock';
import Ui from '../mock/ui.mock';

use(require('chai-as-promised'));

describe('cli', () => {
	var cli: Cli;

	beforeEach(() => {
		cli = new Cli({
			ui: new Ui()
		});
	});

	it('should run a command when it is matched', (done) => {
		var ranCreate = false,
			Create = getCreate(() => {
				ranCreate = true;
			});
		
		expect(cli.run({
			commands: {
				create: Create
			},
			args: [Create.commandName]
		})).to.eventually.be.an('undefined').notify(() => {
			expect(ranCreate).to.be.ok;
			done();
		});
	});

	it('should run a command when its alias is matched', (done) => {
		var ranCreate = false,
			Create = getCreate(() => {
				ranCreate = true;
			});
		
		expect(cli.run({
			commands: {
				create: Create
			},
			args: [Create.aliases[0]]
		})).to.eventually.be.an('undefined').notify(() => {
			expect(ranCreate).to.be.ok;
			done();
		});
	});

	it('should return 1 when command not found', (done) => {
		expect(cli.run({
			commands: {},
			args: ['noop']
		})).to.eventually.equal(1).notify(done);
	});
	
	it('should return 1 when erroring', () => {
		expect(cli.error(new Error())).to.equal(1);
	});
});