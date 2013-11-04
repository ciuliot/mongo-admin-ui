/// <reference path='../../../interfaces/express.d.ts'/>

import express = require("express");

function configure(server: ExpressApplication) {
    server.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
}

(module).exports = function() {
    var server = this;
    configure(server);
}
