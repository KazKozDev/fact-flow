// Тестовый файл для проверки логики валидации статуса
// Запуск: node test_status_validation.js

// Симуляция функции validateStatusAgainstExplanation
function validateStatusAgainstExplanation(claim, originalStatus, explanation) {
  console.log(`Validating status: ${originalStatus} against explanation for claim: "${claim}"`);
  
  // Ключевые слова и фразы, указывающие на ложность утверждения
  const misleadingKeywords = [
    'противоречит',
    'не соответствует',
    'неверно',
    'ложно',
    'ошибочно',
    'неточно',
    'искажает',
    'не подтверждается',
    'опровергается',
    'несоответствие',
    'противоположно',
    'неправильно',
    'не имеет',
    'нет детей',
    'нет жены',
    'нет мужа',
    'отрицает',
    'опровергнуто',
    'фактически неверно',
    'на самом деле',
    'в действительности',
    'показывают обратное',
    'указывают на то, что',
    'свидетельствуют о том, что не'
  ];

  // Ключевые слова, указывающие на подтверждение
  const verifiedKeywords = [
    'подтверждается',
    'соответствует',
    'верно',
    'правильно',
    'точно',
    'корректно',
    'подтверждают',
    'согласуется',
    'совпадает',
    'подкрепляется'
  ];

  const explanationLower = explanation.toLowerCase();
  
  // Проверяем на наличие ключевых слов, указывающих на ложность
  const hasMisleadingIndicators = misleadingKeywords.some(keyword => 
    explanationLower.includes(keyword.toLowerCase())
  );
  
  // Проверяем на наличие ключевых слов, указывающих на подтверждение
  const hasVerifiedIndicators = verifiedKeywords.some(keyword => 
    explanationLower.includes(keyword.toLowerCase())
  );
  
  // Специфичные паттерны для анализа противоречий
  const contradictionPatterns = [
    /(?:источники?\s+(?:показывают|указывают|утверждают|говорят)\s+(?:что\s+)?(?:у\s+\w+\s+(?:есть|имеется)|существует))/i,
    /(?:на\s+самом\s+деле|в\s+действительности|фактически)\s+(?:у\s+\w+\s+(?:есть|имеется)|существует)/i,
    /(?:утверждение\s+(?:неверно|ложно|неточно|противоречит))/i,
    /(?:не\s+соответствует\s+(?:данным|информации|фактам))/i
  ];
  
  const hasContradictionPattern = contradictionPatterns.some(pattern => 
    pattern.test(explanation)
  );
  
  console.log(`Analysis results:
    - Original status: ${originalStatus}
    - Has misleading indicators: ${hasMisleadingIndicators}
    - Has verified indicators: ${hasVerifiedIndicators}
    - Has contradiction pattern: ${hasContradictionPattern}
    - Explanation preview: ${explanation.substring(0, 200)}...`);
  
  // Логика принятия решения
  if (originalStatus.toLowerCase() === 'verified') {
    // Если статус "Verified", но объяснение указывает на противоречие - меняем на Misleading
    if (hasMisleadingIndicators || hasContradictionPattern) {
      console.log('⚠️ Status correction: Verified -> Misleading (based on explanation analysis)');
      return 'Misleading';
    }
  }
  
  if (originalStatus.toLowerCase() === 'misleading') {
    // Если статус "Misleading", но объяснение четко подтверждает - можем оставить или поменять
    if (hasVerifiedIndicators && !hasMisleadingIndicators && !hasContradictionPattern) {
      console.log('⚠️ Status correction: Misleading -> Verified (based on explanation analysis)');
      return 'Verified';
    }
  }
  
  if (originalStatus.toLowerCase() === 'unverified') {
    // Если статус "Unverified", но есть четкие индикаторы - корректируем
    if (hasMisleadingIndicators || hasContradictionPattern) {
      console.log('⚠️ Status correction: Unverified -> Misleading (based on explanation analysis)');
      return 'Misleading';
    } else if (hasVerifiedIndicators && !hasMisleadingIndicators) {
      console.log('⚠️ Status correction: Unverified -> Verified (based on explanation analysis)');
      return 'Verified';
    }
  }
  
  console.log(`✅ Status validation passed: keeping original status "${originalStatus}"`);
  return originalStatus;
}

// Тестовые кейсы
console.log('=== ТЕСТИРОВАНИЕ ЛОГИКИ ВАЛИДАЦИИ СТАТУСА ===\n');

// Тест 1: LLM вернул Verified, но объяснение противоречит
console.log('ТЕСТ 1: LLM говорит Verified, но объяснение показывает противоречие');
const test1 = validateStatusAgainstExplanation(
  "У Элона Маска нет детей",
  "Verified",
  "Утверждение противоречит источникам. Согласно Wikipedia и другим источникам, у Элона Маска есть дети. Источники показывают, что у него несколько детей от разных браков."
);
console.log(`Результат: ${test1}\n`);

// Тест 2: LLM вернул Verified, объяснение действительно подтверждает
console.log('ТЕСТ 2: LLM говорит Verified, объяснение подтверждает');
const test2 = validateStatusAgainstExplanation(
  "Париж - столица Франции",
  "Verified", 
  "Утверждение подтверждается всеми источниками. Париж действительно является столицей Франции согласно официальным данным."
);
console.log(`Результат: ${test2}\n`);

// Тест 3: LLM вернул Misleading правильно
console.log('ТЕСТ 3: LLM правильно определил Misleading');
const test3 = validateStatusAgainstExplanation(
  "Bitcoin был создан в 2010 году",
  "Misleading",
  "Утверждение не соответствует фактам. Bitcoin был создан в 2009 году, а не в 2010. Источники четко указывают на 2009 год как дату создания."
);
console.log(`Результат: ${test3}\n`);

// Тест 4: Пограничный случай - Unverified с признаками противоречия
console.log('ТЕСТ 4: Unverified с признаками противоречия');
const test4 = validateStatusAgainstExplanation(
  "Марк Цукерберг не имеет высшего образования",
  "Unverified",
  "На самом деле источники показывают, что Марк Цукерберг учился в Гарварде, но не закончил обучение."
);
console.log(`Результат: ${test4}\n`);

console.log('=== ТЕСТИРОВАНИЕ ЗАВЕРШЕНО ===');
