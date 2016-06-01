import {graphql} from 'graphql';
import {getTypes} from './type';
import {getSchema, getFields, getFieldsAndMutations, getQueryField} from './schema';
import {getModels} from './model';

function _getTypes(mongooseModels) {
  const graffitiModels = getModels(mongooseModels);
  return getTypes(graffitiModels);
}

export default {
  graphql,
  getSchema,
  getTypes: _getTypes
};

export {
  graphql,
  getSchema,
  _getTypes as getTypes,
  getModels,
  getFields,
  getFieldsAndMutations,
  getQueryField
};
