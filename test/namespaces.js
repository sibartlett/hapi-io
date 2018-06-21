'use strict';

const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const { expect } = Code;
const { describe, it } = lab;

describe('request', () => {

    const namespaces = require('../lib/namespaces');

    describe('namespaces(io, namespaces)',() => {

        it('returns object containing namespaces', () => {

            const io = { of: (namespace) => namespace };
            const names = ['/hello', '/bye'];
            const nsps = namespaces(io, names);

            expect(nsps).to.equal({
                '/': io.of('/'),
                '/hello': io.of('/hello'),
                '/bye': io.of('/bye')
            });
        });

        it('always returns default namespace', () => {

            const io = { of: (namespace) => namespace };
            const names = 'blah';
            const nsps = namespaces(io, names);

            expect(nsps).to.equal({
                '/': io.of('/')
            });
        });

    });

});
