/// <reference path='express.d.ts'/>

declare module "locomotive" {
	import express = require("express");

	export function boot(directory: string, environment: string, options: any, callback: (err: any, server: ExpressApplication) => void): void;
	export function controller(name: string, controller: any): void;

	export class Controller {
    	res: ExpressServerResponse;
    	req: ExpressServerRequest;
        server: ExpressApplication;

    	__beforeFilters: any[];
    	__afterFilters: any[];

    	param(name: string): any;
        render() : void;
        after(filter:string, callback: (err: any, req: ExpressServerRequest, res: ExpressServerResponse, next: Function) => void): void;

        urlFor(params: any) : string;
        redirect(to: string) : void;

        before(name: string, callback: (next: Function) => void): void;
    }
}