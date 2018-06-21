'use strict';

const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const { expect } = Code;
const { describe, it } = lab;

describe('request', () => {

    const request = require('../lib/request');

    describe('request(socket, route, data)', () => {

        it('handles empty request', () => {

            const req = request({});

            expect(req).to.equal({
                method: 'get',
                url: '/',
                headers: {},
                payload: '{}'
            });
        });

        it('maps socket param to request.plugins["hapi-io"]', () => {

            const req = request({
                route: {
                    method: 'get',
                    path: '/'
                },
                socket: 'MY_SOCKET'
            });

            expect(req).to.equal({
                method: 'get',
                url: '/',
                headers: {},
                payload: '{}',
                plugins: {
                    'hapi-io': {
                        socket: 'MY_SOCKET'
                    }
                }
            });
        });

        it('maps data param to query object when GET', () => {

            const req = request({
                route: {
                    method: 'get',
                    path: '/'
                },
                data: { myparam: 'hello world' }
            });

            expect(req).to.equal({
                method: 'get',
                url: '/?myparam=hello%20world',
                headers: {},
                payload: '{}'
            });
        });

        it('maps data param to payload object when POST', () => {

            const req = request({
                route: {
                    method: 'post',
                    path: '/'
                },
                data: { myparam: 'hello world' }
            });

            expect(req).to.equal({
                method: 'post',
                url: '/',
                headers: {},
                payload: JSON.stringify({ myparam: 'hello world' })
            });
        });

        it('maps data param to payload with validate mapping', () => {

            const req = request({
                route: {
                    method: 'post',
                    path: '/',
                    settings: {
                        validate: {
                            payload: {
                                myparam: true
                            }
                        }
                    }
                },
                data: { myparam: 'hello world' }
            });

            expect(req).to.equal({
                method: 'post',
                url: '/',
                headers: {},
                payload: JSON.stringify({ myparam: 'hello world' })
            });
        });

        it('maps data param to query with validate mapping', () => {

            const req = request({
                route: {
                    method: 'post',
                    path: '/',
                    settings: {
                        validate: {
                            query: {
                                myparam: true
                            }
                        }
                    }
                },
                data: { myparam: 'hello world' }
            });

            expect(req).to.equal({
                method: 'post',
                url: '/?myparam=hello%20world',
                headers: {},
                payload: '{}'
            });
        });

        it('maps data param to headers with validate mapping', () => {

            const req = request({
                route: {
                    method: 'post',
                    path: '/',
                    settings: {
                        validate: {
                            headers: {
                                myparam: true
                            }
                        }
                    }
                },
                data: { myparam: 'hello world' }
            });

            expect(req).to.equal({
                method: 'post',
                url: '/',
                headers: { myparam: 'hello world' },
                payload: '{}'
            });
        });

        it('maps data param to query when validate mapping specifies both query and headers', () => {

            const req = request({
                route: {
                    method: 'post',
                    path: '/',
                    settings: {
                        validate: {
                            query: {
                                myparam: true
                            },
                            headers: {
                                myparam: true
                            }
                        }
                    }
                },
                data: { myparam: 'hello world' }
            });

            expect(req).to.equal({
                method: 'post',
                url: '/?myparam=hello%20world',
                headers: {},
                payload: '{}'
            });
        });

        it('maps data param to query when validate mapping specifies both query and payload', () => {

            const req = request({
                route: {
                    method: 'post',
                    path: '/',
                    settings: {
                        validate: {
                            query: {
                                myparam: true
                            },
                            payload: {
                                myparam: true
                            }
                        }
                    }
                },
                data: { myparam: 'hello world' }
            });

            expect(req).to.equal({
                method: 'post',
                url: '/?myparam=hello%20world',
                headers: {},
                payload: '{}'
            });
        });

        it('maps data param to payload with custom mapping', () => {

            const req = request({
                route: {
                    method: 'post',
                    path: '/',
                    settings: {
                        plugins: {
                            'hapi-io': {
                                mapping: {
                                    payload: ['myparam']
                                }
                            }
                        }
                    }
                },
                data: { myparam: 'hello world' }
            });

            expect(req).to.equal({
                method: 'post',
                url: '/',
                headers: {},
                payload: JSON.stringify({ myparam: 'hello world' })
            });
        });

        it('maps data param to query with custom mapping', () => {

            const req = request({
                route: {
                    method: 'post',
                    path: '/',
                    settings: {
                        plugins: {
                            'hapi-io': {
                                mapping: {
                                    query: ['myparam']
                                }
                            }
                        }
                    }
                },
                data: { myparam: 'hello world' }
            });

            expect(req).to.equal({
                method: 'post',
                url: '/?myparam=hello%20world',
                headers: {},
                payload: '{}'
            });
        });

        it('maps data param to headers with custom mapping', () => {

            const req = request({
                route: {
                    method: 'post',
                    path: '/',
                    settings: {
                        plugins: {
                            'hapi-io': {
                                mapping: {
                                    headers: ['myparam']
                                }
                            }
                        }
                    }
                },
                data: { myparam: 'hello world' }
            });

            expect(req).to.equal({
                method: 'post',
                url: '/',
                headers: { myparam: 'hello world' },
                payload: '{}'
            });
        });

        it('maps Authorization header from query', () => {

            const socket = {
                request: {
                    _query: { Authorization: 'MyToken' },
                    headers: {}
                }
            };

            const req = request({
                socket,
                route: {
                    method: 'get',
                    path: '/'
                },
                data: {}
            });

            expect(req).to.equal({
                method: 'get',
                url: '/?Authorization=MyToken',
                headers: { Authorization: 'MyToken' },
                payload: '{}',
                plugins: {
                    'hapi-io': {
                        socket
                    }
                }
            });
        });

        it('maps Authorization header from data', () => {

            const req = request({
                route: {
                    method: 'get',
                    path: '/'
                },
                data: { Authorization: 'MyToken' }
            });

            expect(req).to.equal({
                method: 'get',
                url: '/?Authorization=MyToken',
                headers: { Authorization: 'MyToken' },
                payload: '{}'
            });
        });

        it('maps Authorization header case-insensitive', () => {

            const req = request({
                route: {
                    method: 'post',
                    path: '/'
                },
                data: { authorization: 'MyToken' }
            });

            expect(req).to.equal({
                method: 'post',
                url: '/',
                headers: { authorization: 'MyToken' },
                payload: JSON.stringify({ authorization: 'MyToken' })
            });
        });

        it('does not map Authorization header when it already exists', () => {

            const socket = {
                request: {
                    headers: { Authorization: 'MyToken' }
                }
            };

            const req = request({
                socket,
                route: {
                    method: 'get',
                    path: '/'
                }
            });

            expect(req).to.equal({
                method: 'get',
                url: '/',
                headers: { Authorization: 'MyToken' },
                payload: '{}',
                plugins: {
                    'hapi-io': {
                        socket
                    }
                }
            });
        });

        it('maps data param to path param', () => {

            const req = request({
                route: {
                    method: 'get',
                    path: '/blog-post/{blogId}'
                },
                data: {
                    blogId: 1
                }
            });

            expect(req).to.equal({
                method: 'get',
                url: '/blog-post/1',
                headers: {},
                payload: '{}'
            });
        });

        it('does not map missing data param to path param', () => {

            const req = request({
                route: {
                    method: 'get',
                    path: '/blog-post/{blogId}'
                }
            });

            expect(req).to.equal({
                method: 'get',
                url: '/blog-post/{blogId}',
                headers: {},
                payload: '{}'
            });
        });

        it('maps data param to optional path param', () => {

            const req = request({
                route: {
                    method: 'get',
                    path: '/blog-post/{blogId?}'
                },
                data: {
                    blogId: 1
                }
            });

            expect(req).to.equal({
                method: 'get',
                url: '/blog-post/1',
                headers: {},
                payload: '{}'
            });
        });

        it('does not map missing data param to optional path param', () => {

            const req = request({
                route: {
                    method: 'get',
                    path: '/blog-post/{blogId?}'
                }
            });

            expect(req).to.equal({
                method: 'get',
                url: '/blog-post/',
                headers: {},
                payload: '{}'
            });
        });

    });

});
