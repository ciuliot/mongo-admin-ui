/// <reference path='../interfaces/express.d.ts'/>
/// <reference path='../interfaces/node.d.ts'/>
/// <reference path='../interfaces/locomotive.d.ts'/>
/// <reference path='../interfaces/log4js.d.ts'/>

/**
 * @namespace Server
 */

import locomotive = require("locomotive");
import log4js = require("log4js");
import path = require("path");
import util = require("util");
import fs = require("fs");
import abstractController = require("./controllers/abstractController");
import configuration = require("./config/configuration");

var diveSync = require('diveSync');
var http = require('http');

export class Server {
    private logger: Logger;

    /** 
    * @method constructor
    */
    constructor() {
        this.logger = log4js.getLogger('Server');

        if (!fs.existsSync("logs")) {
            fs.mkdirSync("logs");
        }

        log4js.configure({
            appenders: [
                { type: 'console' },
                { type: 'file', filename: 'logs/app.log' }
            ]
        });
    }

    private loadControllers() {
        var self = this;
        var config = configuration.ServerConfiguration;
        var dir = path.resolve(config.startupDirectory, './dist/controllers');
        var exts = ['js'];
        var exception: any;

        diveSync(dir, function(err: Error, filePath: string) {
            if (exception) { return; }
            var regex = new RegExp('\\.(' + exts.join('|') + ')$');
            if (regex.test(filePath)) {
                var name = filePath.slice(dir.length + 1).replace(regex, '');
                self.logger.debug('Trying to register controller from file %s', name);
                try {
                    var type = require(filePath);
                    console.log(type);
                    var instance: locomotive.Controller;
                    var className: string;

                    for (var i in type) {
                        if (typeof (type[i]) === 'function') {
                            self.logger.debug("Found initialize function %s", i);

                            var tempObject: abstractController.AbstractController = new type[i](i);

                            if (tempObject.__beforeFilters && tempObject.__afterFilters) {
                                className = i;
                                instance = tempObject;
                                break;
                            }
                        }
                    }

                    if (!!instance) {
                        self.logger.debug("Registering controller class %s as %s", className, name);
                        locomotive.controller(name, instance);
                    }
                } catch (ex) {
                    self.logger.error(util.format("Exception occured during controller '%s' load", name), ex);
                    exception = ex;
                }
            }
        });
    }

    /**
    * Starts the server: </br>
    * <ul>
    * <li> boots the locomotive (process environment call, initializers and routes)
    * <li> configures and starts HTTPS server
    * <li> configures and starts HTTP server
    * </ul>
    * @method start
    * @param callback? {Function} (error?) Callback function to be called when the server sucesfully starts, or fails to start.
    * @param callback.error? {Any} Error status of starting the server.
    * @async
    */
    start(callback?: (error?: any) => void) {
        var self = this;
        var config = configuration.ServerConfiguration;
        config.logger = this.logger;

        this.logger.info("Application starting in %s", config.startupDirectory);

        var options = {
            env: config.environment,
            initializersDir: path.resolve(config.startupDirectory, './dist/config/initializers'),
            // Since we are loading controllers in alternative way point Locomotive to invalid directory
            environmentsDir: path.resolve(config.startupDirectory, './dist/config/environments'),
            routesFile: path.resolve(config.startupDirectory, './dist/config/routes.js')
        };

        this.logger.debug("Server environment: %s", options.env);
        this.logger.debug("Initializers directory: %s", options.initializersDir);
        this.logger.debug("Enviromnents directory: %s", options.environmentsDir);
        this.logger.debug("Routes file: %s", options.routesFile);

        locomotive.boot(config.startupDirectory, config.environment, options, (err: any, server: any) => {
            if (err) {
                if (callback) {
                    callback(err);
                }

                throw err;
            }

            server.use(server.router);

            self.loadControllers();

            http.createServer(server).listen(
                config.http_port, config.http_address,
                function() {
                    var addr = this.address();
                    self.logger.info('HTTP server listening on %s:%d', addr.address, addr.port);
                });
        });// locomotive.boot
    }
}

