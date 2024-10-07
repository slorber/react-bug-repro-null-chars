


/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {PassThrough, Writable} = require('node:stream');
const {text} = require('node:stream/consumers');
const {
    default: renderApp,
    ReactDOMServer,
} = require('./__server/server.bundle');

async function repro() {
    console.log('REPRO START');
    await renderPathname('/blog/releases/3.0');
    await renderPathname('/blog/releases/3.1');
    await renderPathname('/blog/releases/3.2');
    await renderPathname('/blog/releases/3.3');
    await renderPathname('/blog/releases/3.4');
    await renderPathname('/blog/releases/3.5');
    console.log('REPRO END');
}

repro();

async function renderPathname(pathname) {
    const {app} = await renderApp({
        pathname,
    });

    const htmlRef = await renderToHtmlReference(app);
    const htmlStream1 = await renderToHtmlStream1(app);
    const htmlStream2 = await renderToHtmlStream2(app);

    if (htmlStream1 !== htmlRef || htmlStream2 !== htmlRef) {
        console.error(`HTML difference detected for pathname=${pathname}
htmlRef.length=${htmlRef.length} (${countNulls(htmlRef)} nulls)
htmlStream1.length=${htmlStream1.length} (${countNulls(htmlStream1)} nulls)
htmlStream2.length=${htmlStream2.length} (${countNulls(htmlStream2)} nulls)
    `);
    } else {
        console.log(`Successfully rendered the same HTML for pathname=${pathname}`);
    }
}

function countNulls(str) {
    return (str.match(/\0/g) || []).length;
}

async function renderToHtmlReference(app) {
    return ReactDOMServer.renderToString(app);
}

async function renderToHtmlStream1(app) {
    return new Promise((resolve, reject) => {
        const passThrough = new PassThrough();
        const {pipe} = ReactDOMServer.renderToPipeableStream(app, {
            onError(error) {
                reject(error);
            },
            onAllReady() {
                pipe(passThrough);
                text(passThrough).then(resolve, reject);
            },
        });
    });
}

async function renderToHtmlStream2(app) {
    class WritableStream extends Writable {
        html = '';
        decoder = new TextDecoder();
        _write(chunk, enc, next) {
            this.html += this.decoder.decode(chunk, {stream: true});
            next();
        }
        _final() {
            this.html += this.decoder.decode();
        }
    }

    return new Promise((resolve, reject) => {
        const {pipe} = ReactDOMServer.renderToPipeableStream(app, {
            onError(error) {
                reject(error);
            },
            onAllReady() {
                const writeableStream = new WritableStream();
                pipe(writeableStream);
                resolve(writeableStream.html);
            },
        });
    });
}
