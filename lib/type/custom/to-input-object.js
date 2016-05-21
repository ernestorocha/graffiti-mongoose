'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /**
                                                                                                                                                                                                                                                                   * Detailed explanation https://github.com/graphql/graphql-js/issues/312#issuecomment-196169994
                                                                                                                                                                                                                                                                   */

var _schema = require('../../schema/schema');

var _graphql = require('graphql');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function filterFields(obj, filter) {
  return Object.keys(obj).filter(filter).reduce(function (result, key) {
    return _extends({}, result, _defineProperty({}, key, convertInputObjectField(obj[key])));
  }, // eslint-disable-line
  {});
}

var cachedTypes = {};
function createInputObject(type) {
  var typeName = type.name + 'Input';

  if (!cachedTypes.hasOwnProperty(typeName)) {
    cachedTypes[typeName] = new _graphql.GraphQLInputObjectType({
      name: typeName,
      fields: {}
    });
    cachedTypes[typeName]._typeConfig.fields = function () {
      return filterFields(type.getFields(), function (field) {
        return !field.noInputObject;
      });
    }; // eslint-disable-line
  }

  return cachedTypes[typeName];
}

function convertInputObjectField(field) {
  var fieldType = field.type;
  var wrappers = [];

  while (fieldType.ofType) {
    wrappers.unshift(fieldType.constructor);
    fieldType = fieldType.ofType;
  }

  if (!(fieldType instanceof _graphql.GraphQLInputObjectType || fieldType instanceof _graphql.GraphQLScalarType || fieldType instanceof _graphql.GraphQLEnumType)) {
    fieldType = fieldType.getInterfaces().includes(_schema.nodeInterface) ? _graphql.GraphQLID : createInputObject(fieldType);
  }

  fieldType = wrappers.reduce(function (type, Wrapper) {
    return new Wrapper(type);
  }, fieldType);

  return { type: fieldType };
}

exports.default = createInputObject;