// 测试答案识别算法
const testCases = [
  {
    name: "简单测试",
    original: "NASA's Artemis 2 mission takes off and the spacecraft is now in orbit around the Earth.",
    blanked: "NASA's Artemis 2 mission ____ and the spacecraft is now ____ around the Earth."
  },
  {
    name: "带序号标记",
    original: "NASA's Artemis 2 mission takes off and the spacecraft is now in orbit around the Earth.",
    blanked: "NASA's Artemis 2 mission (1)____ and the spacecraft is now (2)____ around the Earth."
  },
  {
    name: "多行文本",
    original: "NASA's Artemis 2 mission takes off.\nThe spacecraft is now in orbit around the Earth.",
    blanked: "NASA's Artemis 2 mission ____.\nThe spacecraft is now ____ around the Earth."
  },
  {
    name: "复杂测试",
    original: "If all goes well, it will get the green light to head to the Moon. In an address to the nation, President Trump says the US core strategic objectives in the war in Iran are nearing completion.",
    blanked: "If all goes well, it will get the ____ to head to the Moon. In an ____ to the nation, President Trump says the US ____ in the war in Iran are ____."
  },
  {
    name: "空格换行不一致",
    original: "NASA's Artemis 2 mission takes off and the spacecraft is now in orbit around the Earth.",
    blanked: "NASA's    Artemis 2 mission     ____    and the spacecraft is now     ____    around the Earth."
  },
  {
    name: "混合空格换行",
    original: "NASA's Artemis 2 mission takes off\nand the spacecraft is now in orbit around the Earth.",
    blanked: "NASA's Artemis 2 mission     ____\nand the spacecraft is now     ____ around the Earth."
  }
];

function parseBlanks(originalText, blankedText) {
  // 步骤1: 清理原文，保留段落结构
  const cleanOriginal = originalText
    .replace(/[ \t]+/g, ' ')  // 只合并空格和制表符
    .replace(/\n\s*/g, '\n')  // 清理换行后的空格
    .trim();
  
  // 步骤2: 清理挖空文本，移除序号标记，保留段落结构
  let cleanedBlankedText = blankedText
    .replace(/\(\d+\)/g, ' ')     // 清理 (1) (2) 等序号
    .replace(/（\d+）/g, ' ')     // 清理 （1）（2）等序号
    .replace(/[ \t]+/g, ' ')     // 只合并空格和制表符
    .replace(/\n\s*/g, '\n')     // 清理换行后的空格
    .trim();
  
  // 步骤3: 识别下划线挖空标记
  const blankPattern = /_+/g;
  const markers = [];
  
  let match;
  const freshRegex = new RegExp(blankPattern.source, blankPattern.flags);
  while ((match = freshRegex.exec(cleanedBlankedText)) !== null) {
    markers.push({ 
      start: match.index, 
      end: match.index + match[0].length
    });
  }
  
  // 按位置排序
  markers.sort((a, b) => a.start - b.start);
  
  if (markers.length === 0) {
    return { blanks: [], cleanedText: cleanedBlankedText };
  }
  
  // 步骤4: 构建清理后的文本，保留段落结构
  let cleanText = cleanedBlankedText;
  for (let i = markers.length - 1; i >= 0; i--) {
    const m = markers[i];
    // 确保挖空标记周围有空格
    const before = cleanText.slice(0, m.start);
    const after = cleanText.slice(m.end);
    const needsSpaceBefore = before && !before.endsWith(' ') && !before.endsWith('\n');
    const needsSpaceAfter = after && !after.startsWith(' ') && !after.startsWith('\n');
    
    const blankWithSpaces = (needsSpaceBefore ? ' ' : '') + '[BLANK]' + (needsSpaceAfter ? ' ' : '');
    cleanText = before + blankWithSpaces + after;
  }
  
  // 清理挖空标记周围的多余空格
  cleanText = cleanText
    .replace(/[ \t]+\[BLANK\][ \t]+/g, ' [BLANK] ')
    .replace(/\n[ \t]*\[BLANK\][ \t]*/g, '\n[BLANK] ')
    .replace(/[ \t]*\[BLANK\][ \t]*\n/g, ' [BLANK]\n')
    .trim();
  
  // 步骤5: 智能清理挖空文本，只保留与原文相关的内容
  // 为了匹配，将原文转换为单行并提取单词
  const singleLineOriginal = cleanOriginal.replace(/\n/g, ' ');
  const originalWords = singleLineOriginal
    .split(/\s+/)
    .filter(w => w.length > 0);
  
  // 分割挖空文本为文本段，保留段落结构
  let segments = cleanText.split('[BLANK]');
  
  // 智能清理每个文本段，只保留在原文中存在的内容
  segments = segments.map(segment => {
    if (!segment || segment.trim() === '') {
      return segment;
    }
    
    // 保留段落结构
    const paragraphs = segment.split('\n');
    const cleanedParagraphs = paragraphs.map(para => {
      const paraWords = para.trim().split(/\s+/);
      const cleanedWords = [];
      
      // 只保留在原文中存在的单词
      for (const word of paraWords) {
        const normWord = word.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
        if (normWord) {
          const found = originalWords.some(origWord => 
            origWord.toLowerCase().replace(/[^a-zA-Z0-9]/g, '') === normWord
          );
          if (found) {
            cleanedWords.push(word);
          }
        }
      }
      
      return cleanedWords.join(' ');
    });
    
    return cleanedParagraphs.join('\n').trim();
  });
  
  // 重新构建清理后的文本，保留段落结构
  cleanText = segments.join('[BLANK]')
    .replace(/[ \t]+\[BLANK\][ \t]+/g, ' [BLANK] ')
    .replace(/\n[ \t]*\[BLANK\][ \t]*/g, '\n[BLANK] ')
    .replace(/[ \t]*\[BLANK\][ \t]*\n/g, ' [BLANK]\n')
    .trim();
  
  // 清理所有多余的空白字符，确保格式一致
  cleanText = cleanText
    .replace(/[ \t]+/g, ' ')  // 合并连续空格
    .replace(/\n\s*/g, '\n')  // 清理换行后的空格
    .trim();
  
  // 步骤6: 提取挖空位置
  const blankPositions = [];
  let searchPos = 0;
  while (true) {
    const pos = cleanText.indexOf('[BLANK]', searchPos);
    if (pos === -1) break;
    blankPositions.push({ start: pos, end: pos + 7 });
    searchPos = pos + 7;
  }
  
  // 步骤7: 生成答案
  const answers = [];
  
  console.log('Segments:', segments);
  console.log('Original text:', cleanOriginal);
  console.log('Number of blanks:', markers.length);
  
  let lastPos = 0;
  
  for (let i = 0; i < markers.length; i++) {
    // 清理段落结构，只保留文本内容用于匹配
    const segment = segments[i] ? segments[i].replace(/\n/g, ' ').trim() : '';
    const nextSegment = segments[i + 1] ? segments[i + 1].replace(/\n/g, ' ').trim() : '';
    
    console.log(`Processing blank ${i}: segment="${segment}", nextSegment="${nextSegment}"`);
    
    if (segment && nextSegment) {
      // 有前后文本，在原文中找到对应的位置
      const segmentPos = singleLineOriginal.indexOf(segment, lastPos);
      if (segmentPos !== -1) {
        const nextSegmentPos = singleLineOriginal.indexOf(nextSegment, segmentPos + segment.length);
        if (nextSegmentPos !== -1) {
          // 提取答案
          const answer = singleLineOriginal.slice(segmentPos + segment.length, nextSegmentPos).trim();
          answers.push(answer);
          lastPos = nextSegmentPos;
          console.log(`Found answer: "${answer}"`);
        } else {
          answers.push('');
          console.log('No next segment found');
        }
      } else {
        answers.push('');
        console.log('No segment found');
      }
    } else if (segment) {
      // 只有前文本，取到末尾
      const segmentPos = singleLineOriginal.indexOf(segment, lastPos);
      if (segmentPos !== -1) {
        const answer = singleLineOriginal.slice(segmentPos + segment.length).trim();
        answers.push(answer);
        lastPos = segmentPos + segment.length;
        console.log(`Found answer: "${answer}"`);
      } else {
        answers.push('');
        console.log('No segment found');
      }
    } else if (nextSegment) {
      // 只有后文本，从开头取到后文本
      const nextSegmentPos = singleLineOriginal.indexOf(nextSegment, lastPos);
      if (nextSegmentPos !== -1) {
        const answer = singleLineOriginal.slice(lastPos, nextSegmentPos).trim();
        answers.push(answer);
        lastPos = nextSegmentPos;
        console.log(`Found answer: "${answer}"`);
      } else {
        answers.push('');
        console.log('No next segment found');
      }
    } else {
      // 没有前后文本
      answers.push('');
      console.log('No segments found');
    }
  }
  
  // 确保答案数量和挖空数量一致
  while (answers.length < markers.length) {
    answers.push('');
  }
  
  console.log('Generated answers:', answers);
  console.log('Blank count:', markers.length);
  console.log('Answer count:', answers.length);
  
  return { 
    blanks: answers.map((answer, index) => ({
      id: `blank-${index}`,
      answer: answer || '',
      userAnswer: '',
      status: 'idle'
    })),
    cleanedText: cleanText
  };
}

// 运行测试
testCases.forEach((testCase, index) => {
  console.log(`\n=== Test Case ${index + 1}: ${testCase.name} ===`);
  console.log('Original:', testCase.original);
  console.log('Blanked:', testCase.blanked);
  
  const result = parseBlanks(testCase.original, testCase.blanked);
  console.log('Cleaned Text:', result.cleanedText);
  console.log('Answers:', result.blanks.map(b => b.answer));
});
