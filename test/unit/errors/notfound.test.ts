import {expect} from 'chai';
import NotFoundError from '../../../src/errors/notfound';

describe('NotFoundError', () => {
    it('should be named NotFoundError', () => {
        let error = new NotFoundError();

        expect(error.name).to.equal('NotFoundError');
    });

    it('should include a stack when PLATYPI_VERBOSE_ERRORS', () => {

        let env = process.env.PLATYPI_VERBOSE_ERRORS;

        delete process.env.PLATYPI_VERBOSE_ERRORS;
        let error = new NotFoundError();
        expect(error.stack).to.be.an('undefined');

        process.env.PLATYPI_VERBOSE_ERRORS = true;
        error = new NotFoundError();
        expect(error.stack).to.be.a('string');

        process.env.PLATYPI_VERBOSE_ERRORS = env;
    });
});
