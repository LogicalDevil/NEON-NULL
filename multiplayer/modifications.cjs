'use strict';
const shared=require('./workshop-catalog.cjs'),definitions=shared.definitions;
function validate(id,item){return shared.compatible(id,item)?.id||null}
function apply(item,id){return shared.effective(item,id,'server')}
module.exports={definitions,validate,apply};
