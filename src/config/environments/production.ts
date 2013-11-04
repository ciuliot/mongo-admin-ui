/// <reference path='../../../interfaces/express.d.ts'/>

import configuration = require("../configuration");
import express = require("express");

function configure(server: ExpressApplication): void {
    server.use(express.errorHandler());
}

(module).exports = function() {
    var server = this;
    configure(server);
};

