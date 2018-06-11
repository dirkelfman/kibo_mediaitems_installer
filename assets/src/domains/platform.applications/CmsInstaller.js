/*jslint node: true */
"use strict";
var documentListTypeClientFactory = require('mozu-node-sdk/clients/content/documentListType');
var documentTypeClientFactory = require('mozu-node-sdk/clients/content/documentType');
var documentTreeClientFactory = require('mozu-node-sdk/clients/content/documentlists/documentTree.js');
var documentClientFactory = require('mozu-node-sdk/clients/content/documentlists/document.js');
var entityClientFactory = require('mozu-node-sdk/clients/platform/entitylists/entity.js');

function CmsInstaller(config) {
    this.client = documentListTypeClientFactory(config);
    this.docTypeClient = documentTypeClientFactory(config);
    this.documentClient = documentClientFactory(config);
    this.documentTreeClient = documentTreeClientFactory(config);
    this.entityClient = entityClientFactory(config);
}

module.exports = CmsInstaller;

CmsInstaller.prototype.updateListNamespace = function(list, context) {
    list.nameSpace = context.get.nameSpace();
    list.documentListTypeFQN = list.name + "@" + list.nameSpace;
    return list;
};

CmsInstaller.prototype.upsertSiteList = function(list, context) {
    var me = this;
    list.documentListTypeFQN = list.listFQN;
    // me.updateListNamespace(list, context);
    return me.client.createDocumentListType(list).catch(
        function(e) {

            if ((e.originalError || {}).errorCode !== 'ITEM_ALREADY_EXISTS') {
                console.log(arguments);
            }
            return me.client.updateDocumentListType(list);
        });
};

CmsInstaller.prototype.setSiteBuilderContentListNavVisiblity = function(value) {
    var me = this;
    return me.entityClient.getEntity({ entityListFullName: 'tenantadminsettings@mozu', id: 'Global' })
        .then(function(doc) {
            doc.id = doc.id || doc.name;
            doc.entityListFullName = 'tenantadminsettings@mozu';
            doc.siteBuilderContentListsVisible = value;
            return me.entityClient.updateEntity(doc);
        });
};

CmsInstaller.prototype.upsertDocType = function(documentType, context) {
    var me = this;
    var body = documentType;
    body.documentTypeName = documentType.documentTypeFQN;
    //  me.updateListNamespace(list, context);
    return me.docTypeClient.createDocumentType(body).catch(
        function(e) {

            if ((e.originalError || {}).errorCode !== 'ITEM_ALREADY_EXISTS') {
                console.log(arguments);
            }

            return me.docTypeClient.updateDocumentType(body);
        });
};

CmsInstaller.prototype.upsertDocument = function(document, documentListName) {
    var me = this;
    console.log(documentListName);
    document.documentListName = documentListName;
    document.documentName = document.name;
    document.includeInactive = true;

    return me.documentTreeClient.getTreeDocument(document, {
            context: {
                'master-catalog': 1,
                catalog: 1,
                'dataview-mode': 'Pending'
            }
        })
        .then(function(existingDoc) {
            if (existingDoc.updateDate < document.updateDate || 1 == 1) {
                document.documentId = existingDoc.id;
                console.log('updateing document id ' + document.id);
                return me.documentClient.updateDocument(document, {
                    context: {
                        'master-catalog': 1,
                        catalog: 1,
                    }
                });
            }
        })
        .catch(function(e) {
            if ((e.originalError || {}).errorCode !== 'ITEM_NOT_FOUND') {
                console.log(arguments);
            }
            return me.documentClient.createDocument(document, {
                context: {
                    'master-catalog': 1,
                    catalog: 1
                }
            });
        });
};