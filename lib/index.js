'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getQueryField = exports.getFieldsAndMutations = exports.getFields = exports.getModels = exports.getTypes = exports.getSchema = exports.graphql = undefined;

var _graphql = require('graphql');

var _type = require('./type');

var _schema = require('./schema');

var _model = require('./model');

function _getTypes(mongooseModels) {
  var graffitiModels = (0, _model.getModels)(mongooseModels);
  return (0, _type.getTypes)(graffitiModels);
}

exports.default = {
  graphql: _graphql.graphql,
  getSchema: _schema.getSchema,
  getTypes: _getTypes
};
exports.graphql = _graphql.graphql;
exports.getSchema = _schema.getSchema;
exports.getTypes = _getTypes;
exports.getModels = _model.getModels;
exports.getFields = _schema.getFields;
exports.getFieldsAndMutations = _schema.getFieldsAndMutations;
exports.getQueryField = _schema.getQueryField;