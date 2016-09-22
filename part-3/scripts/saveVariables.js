import fs from 'fs';

const saveVariables = (data) => {
  const fileName = 'tempInstance.js';
  const variableFile = fs.createWriteStream(`./${fileName}`);
  const json = JSON.stringify(data);

  variableFile.write('export default ' + json + ';');
  console.log(`\n> File saved as ${fileName}`);
};

export default saveVariables;
