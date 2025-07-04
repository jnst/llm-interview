const fs = require('fs');
const path = require('path');

const interviewsDir = path.join(__dirname, '../app/data/interviews');
const keypointsDir = path.join(__dirname, '../app/data/keypoints');

function getKeywordFiles() {
  const files = fs.readdirSync(keypointsDir);
  return files
    .filter(file => file.endsWith('.md'))
    .map(file => path.basename(file, '.md'));
}

function addKeywordLinks(text, keywords) {
  let processedText = text;
  const foundKeywords = [];
  
  keywords.forEach(keyword => {
    if (text.includes(keyword)) {
      foundKeywords.push(keyword);
      processedText = processedText.replace(new RegExp(keyword, 'g'), `[${keyword}](../keypoints/${keyword}.md?context=ai)`);
    }
  });
  
  return { processedText, foundKeywords };
}

function parseYaml(yamlContent) {
  const lines = yamlContent.split('\n');
  const data = {};
  
  lines.forEach(line => {
    if (line.includes(':')) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim().replace(/^"(.*)"$/, '$1');
      data[key.trim()] = value;
    }
  });
  
  return data;
}

function convertYamlToMd(yamlFilePath) {
  const yamlContent = fs.readFileSync(yamlFilePath, 'utf8');
  const data = parseYaml(yamlContent);
  
  const keywords = getKeywordFiles();
  const { processedText, foundKeywords } = addKeywordLinks(data.answer, keywords);
  
  const questionNumber = data.id.replace('Q', '');
  
  const mdContent = `---
id: "${data.id}"
keywords: ${JSON.stringify(foundKeywords)}
---

## Question ${questionNumber}

${data.question}

## Answer

${processedText}
`;
  
  const mdFileName = path.basename(yamlFilePath, '.yaml') + '.md';
  const mdFilePath = path.join(interviewsDir, mdFileName);
  
  fs.writeFileSync(mdFilePath, mdContent);
  console.log(`Created: ${mdFileName}`);
}

function main() {
  const yamlFiles = fs.readdirSync(interviewsDir)
    .filter(file => file.endsWith('.yaml'))
    .map(file => path.join(interviewsDir, file));
  
  yamlFiles.forEach(convertYamlToMd);
  console.log(`Converted ${yamlFiles.length} YAML files to Markdown`);
}

main();