import React, { useState, useEffect, useRef } from 'react';
import type { Blank } from '../types';
import { Check, RotateCcw, Eye, EyeOff } from 'lucide-react';

interface FillBlanksProps {
  originalText: string;
  blankedText: string;
}

interface BlankMatch {
  fullMatch: string;
  startIndex: number;
  endIndex: number;
  wordIndex: number;
}

export const FillBlanks: React.FC<FillBlanksProps> = ({ originalText, blankedText }) => {
  const [blanks, setBlanks] = useState<Blank[]>([]);
  const [blankMatches, setBlankMatches] = useState<BlankMatch[]>([]);
  const [cleanedText, setCleanedText] = useState('');
  const [showAnswers, setShowAnswers] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    parseBlanks();
  }, [originalText, blankedText]);

  const parseBlanks = () => {
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
    const markers: { start: number; end: number }[] = [];
    
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
      setCleanedText(cleanedBlankedText);
      setBlankMatches([]);
      setBlanks([]);
      return;
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
    
    // 确保挖空标记周围始终有空格
    cleanText = cleanText
      .replace(/([^\s\n])\[BLANK\]/g, '$1 [BLANK]')
      .replace(/\[BLANK\]([^\s\n])/g, '[BLANK] $1')
      .trim();
    
    // 再次清理多余的空格，确保格式一致
    cleanText = cleanText
      .replace(/[ \t]+/g, ' ')  // 合并连续空格
      .replace(/\n\s*/g, '\n')  // 清理换行后的空格
      .trim();
    
    // 步骤5: 智能清理挖空文本，只保留与原文相关的内容
    // 为了匹配，将原文转换为单行并提取单词
    const singleLineOriginal = cleanOriginal.replace(/\n/g, ' ');
    const originalWords = singleLineOriginal
      .split(/\s+/)
      .filter(w => w.length > 0);
    
    // 分割挖空文本为文本段，保留段落结构
    let segments = cleanText.split('[BLANK]');
    
    // 智能清理每个文本段，只保留与原文相关的内容
    segments = segments.map(segment => {
      if (!segment || segment.trim() === '') {
        return segment;
      }
      
      // 保留段落结构
      const paragraphs = segment.split('\n');
      const cleanedParagraphs = paragraphs.map(para => {
        const paraWords = para.trim().split(/\s+/);
        const cleanedWords: string[] = [];
        
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
    const blankPositions: { start: number; end: number }[] = [];
    let searchPos = 0;
    while (true) {
      const pos = cleanText.indexOf('[BLANK]', searchPos);
      if (pos === -1) break;
      blankPositions.push({ start: pos, end: pos + 7 });
      searchPos = pos + 7;
    }
    
    // 步骤7: 生成答案
    const answers: string[] = [];
    
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
    
    // 构建blankMatches
    const newBlankMatches: BlankMatch[] = blankPositions.map((pos, index) => ({
      fullMatch: '[BLANK]',
      startIndex: pos.start,
      endIndex: pos.end,
      wordIndex: index
    }));
    
    // 构建blanks
    const newBlanks: Blank[] = blankPositions.map((_, index) => ({
      id: `blank-${index}`,
      answer: answers[index] || '',
      userAnswer: '',
      status: 'idle'
    }));
    
    console.log('Final blanks:', newBlanks);
    
    setCleanedText(cleanText);
    setBlankMatches(newBlankMatches);
    setBlanks(newBlanks);
  };

  const handleInputChange = (index: number, value: string) => {
    const newBlanks = [...blanks];
    newBlanks[index] = {
      ...newBlanks[index],
      userAnswer: value,
      status: 'idle'
    };
    setBlanks(newBlanks);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      checkAnswer(index);
      if (index < blanks.length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const checkAnswer = (index: number) => {
    const newBlanks = [...blanks];
    const userAnswer = newBlanks[index].userAnswer.trim().toLowerCase();
    const correctAnswer = newBlanks[index].answer.trim().toLowerCase();
    
    const isCorrect = userAnswer === correctAnswer;
    newBlanks[index] = {
      ...newBlanks[index],
      status: isCorrect ? 'correct' : 'wrong'
    };
    setBlanks(newBlanks);
  };

  const checkAll = () => {
    const newBlanks: Blank[] = blanks.map(blank => {
      const userAnswer = blank.userAnswer.trim().toLowerCase();
      const correctAnswer = blank.answer.trim().toLowerCase();
      const isCorrect = userAnswer === correctAnswer;
      return {
        ...blank,
        status: isCorrect ? 'correct' : 'wrong'
      };
    });
    setBlanks(newBlanks);
  };

  const resetAll = () => {
    const newBlanks: Blank[] = blanks.map(blank => ({
      ...blank,
      userAnswer: '',
      status: 'idle'
    }));
    setBlanks(newBlanks);
    setShowAnswers(false);
  };

  const renderText = () => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    blankMatches.forEach((match, index) => {
      if (match.startIndex > lastIndex) {
        parts.push(
          <span key={`text-${index}`}>
            {cleanedText.slice(lastIndex, match.startIndex)}
          </span>
        );
      }

      const blank = blanks[index];
      if (blank) {
        if (showAnswers) {
          // 显示答案时，显示美观的答案文本
          parts.push(
            <span key={blank.id} className="blank-wrapper">
              <span className="answer-display">{blank.answer}</span>
            </span>
          );
        } else {
          // 正常模式，显示输入框
          parts.push(
            <span key={blank.id} className="blank-wrapper">
              <input
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                value={blank.userAnswer}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onBlur={() => checkAnswer(index)}
                className={`blank-input ${blank.status}`}
              />
            </span>
          );
        }
      }

      lastIndex = match.endIndex;
    });

    if (lastIndex < cleanedText.length) {
      parts.push(<span key="text-end">{cleanedText.slice(lastIndex)}</span>);
    }

    return parts;
  };

  const correctCount = blanks.filter(b => b.status === 'correct').length;
  const totalCount = blanks.length;

  return (
    <div className="fill-blanks-container">
      <div className="exercise-text">
        {renderText()}
      </div>

      <div className="exercise-controls">
        <div className="score-display">
          得分: {correctCount} / {totalCount}
        </div>
        <div className="control-buttons">
          <button onClick={checkAll} className="btn btn-primary">
            <Check size={18} />
            检查答案
          </button>
          <button onClick={resetAll} className="btn btn-secondary">
            <RotateCcw size={18} />
            重置
          </button>
          <button onClick={() => setShowAnswers(!showAnswers)} className={`btn ${showAnswers ? 'btn-warning' : 'btn-info'}`}>
            {showAnswers ? <EyeOff size={18} /> : <Eye size={18} />}
            {showAnswers ? '隐藏答案' : '显示答案'}
          </button>
        </div>
      </div>
    </div>
  );
};
