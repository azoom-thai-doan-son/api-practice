/* eslint-disable prettier/prettier */
import path from 'path';
import util from 'util';
import glob from 'glob';
import express from 'express';
import chalk from 'chalk';
const isFunction = (func) => typeof func === 'function';
const globP = util.promisify(glob);
const reqmethods = [
    'middleware',
    'head',
    'connnect',
    'options',
    'trace',
    'get',
    'post',
    'put',
    'patch',
    'delete',
];
const debugPrefix = chalk.greenBright('[NnnRouter][DEBUG] ');
const jsExt = ['js', 'cjs', 'mjs', 'ts'];
function nnnRouter(options = {}) {
    const debug = (msg) => options.debug && process.stdout.write(msg);
    const routeDir = options.routeDir || 'routes';
    const filePattern = `**/@(${(options.ext?.length
        ? jsExt.filter((ext) => options.ext.includes(ext))
        : [jsExt[0]])
        .map((ext) => `*.${ext}`)
        .join(`|`)})`;
    const absoluteRouteDir = options.absolutePath || path.join(process.cwd(), routeDir);
    const router = (options.baseRouter || express.Router());
    const waitingResponses = [];
    router.use((req, res, next) => {
        waitingResponses.push(res);
        res.once('finish', () => {
            waitingResponses.splice(waitingResponses.indexOf(res), 1);
            removeLayerMiddleware();
        });
        promise.then(() => next()).catch(next);
    });
    const layerMiddleware = router.stack[router.stack.length - 1];
    const removeLayerMiddleware = () => {
        if (waitingResponses.length)
            return;
        // => `waitingResponses` is empty
        // TODO: remove `layerMiddleware` from `router.stack`
        const i = router.stack.indexOf(layerMiddleware);
        if (i >= 0)
            router.stack.splice(i, 1);
    };
    const promise = globP(filePattern, { cwd: absoluteRouteDir }).then(async (relativeFilePaths) => {
        const pathObj = relativeFilePaths.reduce((obj, relativeFilePath) => {
            try {
                const absoluteFilePath = path.join(absoluteRouteDir, relativeFilePath);
                const i = relativeFilePath.lastIndexOf('/');
                const methodName = relativeFilePath.slice(i + 1, relativeFilePath.lastIndexOf('.'));
                const hasMethod = reqmethods.includes(methodName);
                if (!hasMethod)
                    throw new Error(`Invalid filename: "${absoluteFilePath}"`);
                const routePath = i >= 0 ? ('/' + relativeFilePath.slice(0, i)).replace(/\/_/g, '/:') : '/';
                obj[absoluteFilePath] = [methodName, routePath];
            }
            catch (error) {
                console.error(chalk.red('ERROR:'), error);
            }
            return obj;
        }, {});
        const sortedPaths = Object.entries(pathObj).sort((a, b) => {
            // Place middleware on top
            if (a[1][1].startsWith(b[1][1]) && b[1][0] === reqmethods[0]) {
                return 1;
            }
            if (b[1][1].startsWith(a[1][1]) && a[1][0] === reqmethods[0]) {
                return -1;
            }
            // Descending sort for exception handling at dynamic routes
            if (a[1][1] !== b[1][1])
                return a[1][1] < b[1][1] ? 1 : -1;
            // Orderring by index in reqmethods
            return reqmethods.indexOf(a[1][0]) - reqmethods.indexOf(b[1][0]);
        });
        const modules = await Promise.all(sortedPaths.map(([filePath]) => import(filePath)));
        const msgs = sortedPaths.map((item) => {
            const [methodName, routePath] = item[1];
            return methodName === reqmethods[0]
                ? `Applying middleware for route:${chalk.bold(' ')}${routePath}`
                : `Applying route ${chalk.bold(methodName.toUpperCase())} ${routePath}`;
        });
        const maxLength = msgs.reduce((max, msg) => (msg.length > max ? msg.length : max), 0);
        for (let i = 0; i < sortedPaths.length; i++) {
            const [methodName, routePath] = sortedPaths[i][1];
            const msg = msgs[i];
            debug(debugPrefix + msg + ' '.repeat(maxLength - msg.length));
            const module = modules[i];
            const handlers = [];
            if (methodName === reqmethods[0]) {
                // Applying middleware
                if (typeof module === 'object') {
                    handlers.push(...Object.values(module).flat());
                }
                else if (isFunction(module)) {
                    // In CommonJS, the `module` can be a function
                    handlers.push(module);
                }
                if (handlers.length) {
                    router.use(routePath, ...handlers);
                    debug(`   ${chalk.green('⇒ Succeeded!')}\n`);
                }
                else {
                    debug(`   ${chalk.yellow(chalk.bold('⇒ No handling function'))}\n`);
                }
            }
            else {
                if (typeof module.middleware === 'object') {
                    handlers.push(...Object.values(module.middleware).flat());
                }
                else if (isFunction(module.middleware)) {
                    handlers.push(module.middleware);
                }
                if (isFunction(module)) {
                    handlers.push(module);
                }
                else if (isFunction(module.default)) {
                    handlers.push(module.default);
                }
                if (handlers.length) {
                    router[methodName](routePath, ...handlers);
                    debug(`   ${chalk.green('⇒ Succeeded!')}\n`);
                }
                else {
                    debug(`   ${chalk.yellow(chalk.bold('⇒ No handling function'))}\n`);
                }
            }
        }
        debug(debugPrefix + 'Initializing routes completed!\n');
        removeLayerMiddleware();
    });
    router.promise = () => promise;
    return router;
}
export default nnnRouter;
