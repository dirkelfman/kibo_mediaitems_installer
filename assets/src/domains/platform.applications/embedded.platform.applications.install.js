/*jslint node: true */
/* global Promise: true  */
"use strict";

var CmsInstaller = require('./CmsInstaller');

module.exports = function(context, callback) {

    // some json for the list type definition
    var docType = require('./schema/media-items-doctype.json');
    var listType = require('./schema/media-items-list.json');
    var documents = require('./sampleDocs/docs.json');
    var editor = require('./editors/media_item.json');
    var cmsInstaller = new CmsInstaller(context.apiContext);
    

    cmsInstaller.upsertDocType(docType)
        .then(function() {
            return cmsInstaller.upsertSiteList(listType);
        })
        .then(function() {
            return Promise.all(documents.items.map(function(doc) {
                return cmsInstaller.upsertDocument(doc, 'media_items@mozu');
            }));
        })
        .then(function() {
           return cmsInstaller.upsertDocument(editor, 'entityEditors@mozu');
        })
        .then(function(){
            return cmsInstaller.setSiteBuilderContentListNavVisiblity(true);
        })
        .then(callback.bind(null, null), function(err) {
            console.log(arguments);
            callback(err);
        });

};