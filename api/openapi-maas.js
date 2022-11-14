const fs = require('fs');

const OPENAPI_FILEPATH = `./openapi.json`;
const OPENAPI_MAAS_FILENAME = `openapi-maas.json`;
const TAG_MAAS = 'MaaS';

function findAllByKey(obj, keyToFind) {
  return Object.entries(obj).reduce(
    (acc, [key, value]) =>
      key === keyToFind
        ? acc.concat(value)
        : typeof value === 'object'
        ? acc.concat(findAllByKey(value, keyToFind))
        : acc,
    [],
  );
}

fs.readFile(OPENAPI_FILEPATH, 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }

  const parsedData = JSON.parse(data);
  const maasPaths = Object.fromEntries(
    Object.entries(parsedData.paths)
      .map(([key, value]) => [
        key,
        Object.fromEntries(
          Object.entries(value)
            .map(([key, value]) => [key, value])
            .filter(([key, value]) => {
              return value.tags.includes(TAG_MAAS);
            })
            .map(([key, value]) => {
              value.tags = [TAG_MAAS];
              return [key, value];
            }),
        ),
      ])
      .filter(([key, value]) => Object.keys(value).length !== 0),
  );

  let finished = false;
  let schemasList = findAllByKey(maasPaths, '$ref');
  let schemaNames = [...new Set(schemasList)].map(
    value => value.split('#/components/schemas/')[1],
  );
  let schemasCount = schemaNames.length;
  let maasSchemas = {};

  while (!finished) {
    maasSchemas = Object.fromEntries(
      Object.entries(parsedData.components.schemas).filter(([key]) =>
        schemaNames.includes(key),
      ),
    );

    let nestedSchemas = findAllByKey(maasSchemas, '$ref');
    nestedSchemas = [...new Set(nestedSchemas)].map(
      value => value.split('#/components/schemas/')[1],
    );

    schemaNames.push(...nestedSchemas);
    schemaNames = [...new Set(schemaNames)];
    if (schemaNames.length === schemasCount) {
      finished = true;
    } else {
      schemasCount = schemaNames.length;
    }
  }

  const openapiMaas = {
    openapi: parsedData.openapi,
    info: parsedData.info,
    paths: maasPaths,
    servers: parsedData.servers,
    components: {
      securitySchemes: parsedData.components.securitySchemes,
      schemas: maasSchemas,
    },
  };

  fs.writeFile(OPENAPI_MAAS_FILENAME, JSON.stringify(openapiMaas), err => {
    if (err) console.log(err);
    else {
      console.log('File written successfully\n');
    }
  });
});
