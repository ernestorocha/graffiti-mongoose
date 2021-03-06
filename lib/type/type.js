'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getArguments = exports.setTypeFields = exports.getTypeFields = exports.nodeInterface = exports.addType = exports.getTypes = exports.getType = exports.GraphQLGeneric = exports.GraphQLDate = exports.GraphQLViewer = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _graphqlRelay = require('graphql-relay');

var _type2 = require('graphql/type');

var _utils = require('../utils');

var _date = require('./custom/date');

var _date2 = _interopRequireDefault(_date);

var _buffer = require('./custom/buffer');

var _buffer2 = _interopRequireDefault(_buffer);

var _generic = require('./custom/generic');

var _generic2 = _interopRequireDefault(_generic);

var _query = require('../query');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// Registered types will be saved, we can access them later to resolve types
var types = [];

/**
 * Add new type
 * @param {String} name
 * @param {GraphQLType} type
 */
function addType(name, type) {
  types[name] = type;
}

// Node interface

var _nodeDefinitions = (0, _graphqlRelay.nodeDefinitions)(null, function (obj) {
  return(
    // Type resolver
    obj._type ? types[obj._type] : null
  );
});

var nodeInterface = _nodeDefinitions.nodeInterface;

// GraphQL Viewer type

var GraphQLViewer = new _type2.GraphQLObjectType({
  name: 'Viewer',
  interfaces: [nodeInterface]
});

// Register Viewer type
addType('Viewer', GraphQLViewer);

/**
 * Returns a GraphQL type based on a String representation
 * @param  {String} type
 * @return {GraphQLType}
 */
function stringToGraphQLType(type) {
  switch (type) {
    case 'String':
      return _type2.GraphQLString;
    case 'Number':
      return _type2.GraphQLFloat;
    case 'Date':
      return _date2.default;
    case 'Buffer':
      return _buffer2.default;
    case 'Boolean':
      return _type2.GraphQLBoolean;
    case 'ObjectID':
      return _type2.GraphQLID;
    default:
      return _generic2.default;
  }
}

/**
 * Returns a GraphQL Enum type based on a List of Strings
 * @param  {Array} list
 * @param  {String} name
 * @return {Object}
 */
function listToGraphQLEnumType(list, name) {
  var values = (0, _lodash.reduce)(list, function (values, val) {
    values[val] = { value: val };
    return values;
  }, {});
  return new _type2.GraphQLEnumType({ name: name, values: values });
}

/**
 * Extracts the fields of a GraphQL type
 * @param  {GraphQLType} type
 * @return {Object}
 */
function getTypeFields(type) {
  var fields = type._typeConfig.fields;
  return (0, _lodash.isFunction)(fields) ? fields() : fields;
}

/**
 * Assign fields to a GraphQL type
 * @param {GraphQLType} type
 * @param {Object} fields
 */
function setTypeFields(type, fields) {
  type._typeConfig.fields = function () {
    return fields;
  };
}

var orderByTypes = {};
/**
 * Returns order by GraphQLEnumType for fields
 * @param  {{String}} {name}
 * @param  {Object} fields
 * @return {GraphQLEnumType}
 */
function getOrderByType(_ref, fields) {
  var name = _ref.name;

  if (!orderByTypes[name]) {
    // save new enum
    orderByTypes[name] = new _type2.GraphQLEnumType({
      name: 'orderBy' + name,
      values: (0, _lodash.reduce)(fields, function (values, field) {
        if (field.type instanceof _type2.GraphQLScalarType) {
          var upperCaseName = field.name.toUpperCase();
          values[upperCaseName + '_ASC'] = {
            name: upperCaseName + '_ASC',
            value: _defineProperty({}, field.name, 1)
          };
          values[upperCaseName + '_DESC'] = {
            name: upperCaseName + '_DESC',
            value: _defineProperty({}, field.name, -1)
          };
        }

        return values;
      }, {})
    });
  }
  return orderByTypes[name];
}

/**
 * Returns query arguments for a GraphQL type
 * @param  {GraphQLType} type
 * @param  {Object} args
 * @return {Object}
 */
function getArguments(type) {
  var args = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var fields = getTypeFields(type);

  return (0, _lodash.reduce)(fields, function (args, field) {
    // Extract non null fields, those are not required in the arguments
    if (field.type instanceof _type2.GraphQLNonNull && field.name !== 'id') {
      field.type = field.type.ofType;
    }

    if (field.type instanceof _type2.GraphQLScalarType) {
      args[field.name] = field;
    }

    return args;
  }, _extends({}, args, {
    orderBy: {
      name: 'orderBy',
      type: getOrderByType(type, fields)
    }
  }));
}

/**
 * Returns a concatenation of type and field name, used for nestedObjects
 * @param {String} typeName
 * @param {String} fieldName
 * @returns {String}
 */
function getTypeFieldName(typeName, fieldName) {
  var fieldNameCapitalized = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
  return '' + typeName + fieldNameCapitalized;
}

// Holds references to fields that later have to be resolved
var resolveReference = {};

/**
 * Returns GraphQLType for a graffiti model
 * @param  {Object} graffitiModels
 * @param  {{String, String, Object}} {name, description, fields}
 * @param  {Boolean} root
 * @return {GraphQLObjectType}
 */
function getType(graffitiModels, _ref2) {
  var name = _ref2.name;
  var description = _ref2.description;
  var fields = _ref2.fields;
  var path = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];
  var rootType = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];

  var root = path.length === 0;
  var graphQLType = { name: name, description: description };
  rootType = rootType || graphQLType;

  // These references have to be resolved when all type definitions are avaiable
  resolveReference[graphQLType.name] = resolveReference[graphQLType.name] || {};
  var graphQLTypeFields = (0, _lodash.reduce)(fields, function (graphQLFields, _ref3, key) {
    var name = _ref3.name;
    var description = _ref3.description;
    var type = _ref3.type;
    var subtype = _ref3.subtype;
    var reference = _ref3.reference;
    var nonNull = _ref3.nonNull;
    var hidden = _ref3.hidden;
    var hooks = _ref3.hooks;
    var subfields = _ref3.fields;
    var embeddedModel = _ref3.embeddedModel;
    var enumValues = _ref3.enumValues;

    name = name || key;
    var newPath = [].concat(_toConsumableArray(path), [name]);

    // Don't add hidden fields to the GraphQLObjectType
    if (hidden || name.startsWith('__')) {
      return graphQLFields;
    }

    var graphQLField = { name: name, description: description };

    if (type === 'Array') {
      if (subtype === 'Object') {
        var _fields = subfields;
        var nestedObjectName = getTypeFieldName(graphQLType.name, name);
        graphQLField.type = new _type2.GraphQLList(getType(graffitiModels, { name: nestedObjectName, description: description, fields: _fields }, newPath, rootType));
      } else {
        graphQLField.type = new _type2.GraphQLList(stringToGraphQLType(subtype));
        if (reference) {
          resolveReference[rootType.name][name] = {
            name: name,
            type: reference,
            args: _graphqlRelay.connectionArgs,
            resolve: (0, _utils.addHooks)(function (rootValue, args, context, info) {
              args.id = rootValue[name].map(function (i) {
                return i.toString();
              });
              return (0, _query.connectionFromModel)(graffitiModels[reference], args, context, info);
            }, hooks)
          };
        }
      }
    } else if (type === 'Object') {
      var _fields2 = subfields;
      var _nestedObjectName = getTypeFieldName(graphQLType.name, name);
      graphQLField.type = getType(graffitiModels, { name: _nestedObjectName, description: description, fields: _fields2 }, newPath, rootType);
    } else if (type === 'Embedded') {
      var _type = types.hasOwnProperty(name) ? types[name] : getType(graffitiModels, embeddedModel, ['embedded']);
      _type.mongooseEmbedded = true;
      graphQLField.type = _type;
    } else if (enumValues && type === 'String') {
      graphQLField.type = listToGraphQLEnumType(enumValues, getTypeFieldName(graphQLType.name, name + 'Enum'));
    } else {
      graphQLField.type = stringToGraphQLType(type);
    }

    if (reference && (graphQLField.type === _type2.GraphQLID || graphQLField.type === new _type2.GraphQLNonNull(_type2.GraphQLID))) {
      resolveReference[rootType.name][newPath.join('.')] = {
        name: name,
        type: reference,
        resolve: (0, _utils.addHooks)(function (rootValue, args, context, info) {
          var resolver = (0, _query.getOneResolver)(graffitiModels[reference]);
          return resolver(rootValue, { id: rootValue[name] ? rootValue[name].toString() : null }, context, info);
        }, hooks)
      };
    }

    if (nonNull && graphQLField.type) {
      graphQLField.type = new _type2.GraphQLNonNull(graphQLField.type);
    }

    if (!graphQLField.resolve) {
      graphQLField.resolve = (0, _utils.addHooks)(function (source) {
        return source[name];
      }, hooks);
    }

    graphQLFields[name] = graphQLField;
    return graphQLFields;
  }, {});

  if (root) {
    // Implement the Node interface
    graphQLType.interfaces = [nodeInterface];
    graphQLTypeFields.id = (0, _graphqlRelay.globalIdField)(name, function (obj) {
      return obj._id;
    });
  }

  // Add fields to the GraphQL type
  graphQLType.fields = function () {
    return graphQLTypeFields;
  };

  // Define type
  var GraphQLObjectTypeDefinition = new _type2.GraphQLObjectType(graphQLType);

  // Register type
  if (root) {
    addType(name, GraphQLObjectTypeDefinition);
  }

  return GraphQLObjectTypeDefinition;
}

function getTypes(graffitiModels) {
  var types = (0, _lodash.reduce)(graffitiModels, function (types, model) {
    types[model.name] = getType(graffitiModels, model);
    return types;
  }, {});

  // Resolve references, all types are defined / avaiable
  (0, _lodash.forEach)(resolveReference, function (fields, typeName) {
    var type = types[typeName];
    if (type) {
      var typeFields = (0, _lodash.reduce)(fields, function (typeFields, field, fieldName) {
        if (field.args === _graphqlRelay.connectionArgs) {
          // It's a connection
          var connectionName = getTypeFieldName(typeName, fieldName);

          var _connectionDefinition = (0, _graphqlRelay.connectionDefinitions)({
            name: connectionName,
            nodeType: types[field.type],
            connectionFields: {
              count: {
                name: 'count',
                type: _type2.GraphQLFloat
              }
            }
          });

          var connectionType = _connectionDefinition.connectionType;

          field.type = connectionType;
        } else {
          // It's an object reference
          field.type = types[field.type];
        }

        // deeply find the path of the field we want to resolve the reference of
        var path = fieldName.split('.');
        var newTypeFields = _extends({}, typeFields);
        var parent = newTypeFields;
        var segment = void 0;

        while (path.length > 0) {
          segment = path.shift();

          if (parent[segment]) {
            if (parent[segment].type instanceof _type2.GraphQLObjectType) {
              parent = parent[segment].type.getFields();
            } else if (parent[segment].type instanceof _type2.GraphQLList && parent[segment].type.ofType instanceof _type2.GraphQLObjectType) {
              parent = getTypeFields(parent[segment].type.ofType);
            }
          }
        }

        if (path.length === 0) {
          parent[segment] = field;
        }
        return newTypeFields;
      }, getTypeFields(type));

      // Add new fields
      setTypeFields(type, typeFields);
    }
  });

  return types;
}

exports.default = {
  getTypes: getTypes
};
exports.GraphQLViewer = GraphQLViewer;
exports.GraphQLDate = _date2.default;
exports.GraphQLGeneric = _generic2.default;
exports.getType = getType;
exports.getTypes = getTypes;
exports.addType = addType;
exports.nodeInterface = nodeInterface;
exports.getTypeFields = getTypeFields;
exports.setTypeFields = setTypeFields;
exports.getArguments = getArguments;