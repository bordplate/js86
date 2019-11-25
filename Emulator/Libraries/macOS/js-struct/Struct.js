export let Struct = function(fields) {
  let size = 0;
  for (let i = 0; i < fields.length; i++) {
    size += fields[i].size;
  }
  let read = function(bytes, index) {
    let offset = 0;
    let obj = {};
    for (let i = 0, len = fields.length; i < len; i++) {
      let f = fields[i];
      if (f.field) {
        obj[f.field] = f.read(bytes, index + offset);
      }
      offset += f.size;
    }
    return obj;
  };
  let s = function(field) {
    return {
      fields: fields,
      size: size,
      field: field,
      read: read,
    };
  };
  s.fields = fields;
  s.size = size;
  s.read = read;
  return s;
};
