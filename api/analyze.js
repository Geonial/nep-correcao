const Anthropic = require('@anthropic-ai/sdk');

function buildPrompt(examData, studentName) {
    const questionsText = examData.questoes.map(q =>
          `QUESTAO ${q.numero} (Valor: ${q.valor} pts)\n` +
          `Enunciado: ${q.enunciado}\n` +
          `Resposta esperada: ${q.gabarito}\n` +
          `Barema: ${q.barema}\n` +
          `Tolerancia: ${q.tolerancia || 'Padrao - considere a faixa etaria'}\n`
                                                  ).join('\n---\n');

  return `Voce e um assistente pedagogico especializado em apoiar professores de Geografia do Ensino Fundamental II (6 ao 9 ano, alunos de 11 a 15 anos) no Brasil.

  A professora que usa este sistema tem um perfil pedagogico muito especifico:
  - Valoriza MUITO identificar o esforco genuino do aluno versus a enrolacao de quem nao estudou
  - Adora escrever recadinhos pessoais nas provas - e carinhosa mas direta
  - Considera a intencao do aluno: quem tentou recebe mais consideracao do que quem claramente nao se preparou
  - Avalia cuidadosamente a capacidade de interpretacao e argumentacao
  - Nao e professora rigida - calibra o julgamento pela faixa etaria e pelo contexto da turma

  AVALIACAO: ${examData.nome}
  TURMA: ${examData.turma} - ${examData.serie}
  VALOR TOTAL: ${examData.valor_total} pontos
  CONTEXTO DA TURMA: ${examData.contexto || 'Turma padrao de ensino fundamental II'}
  ALUNO SENDO AVALIADO: ${studentName}

  QUESTOES E CRITERIOS DE CORRECAO:
  ${questionsText}

  Analise a resposta manuscrita do aluno na imagem.

  DIRETRIZES DE ANALISE:
  1. Para esforco e intencao: observe se a resposta e especifica (evidencia de estudo) ou vaga/generica (enrolacao). Aluno que tentou mas errou nao e igual a aluno que nao se preparou.
  2. Para argumentacao: na faixa 11-15 anos, argumento parcial ja e positivo - avalie o desenvolvimento relativo a serie.
  3. Para o recadinho pessoal: escreva como a professora escreveria a mao - informal, humano, encorajador ou honesto conforme o caso.
  4. Para o relatorio: use linguagem acessivel para pais e coordenacao pedagogica.

  Retorne SOMENTE um objeto JSON valido, sem texto antes ou depois:

  {
    "notas": [
        {
              "questao": 1,
                    "obtido": 1.5,
                          "maximo": 2.0,
                                "comentario": "Comentario construtivo e especifico sobre esta questao em portugues",
                                      "nivel_esforco": "alto"
                                          }
                                            ],
                                              "total_obtido": 7.5,
                                                "total_maximo": 10.0,
                                                  "analise": {
                                                      "esforco_intencao": {
                                                            "nivel": "alto",
                                                                  "evidencia": "Descricao do que na resposta sustenta essa avaliacao",
                                                                        "tentou_genuinamente": true
                                                                            },
                                                                                "interpretacao": {
                                                                                      "nivel": "adequado",
                                                                                            "observacoes": "Como o aluno le e responde ao que se pede"
                                                                                                },
                                                                                                    "argumentacao": {
                                                                                                          "nivel": "parcial",
                                                                                                                "observacoes": "Qualidade e estrutura do desenvolvimento das respostas"
                                                                                                                    },
                                                                                                                        "escrita": {
                                                                                                                              "ortografia": "erros_pontuais",
                                                                                                                                    "legibilidade": "clara"
                                                                                                                                        },
                                                                                                                                            "pontos_fortes": "O que este aluno demonstra saber ou fazer bem",
                                                                                                                                                "areas_desenvolvimento": "O que precisa ser trabalhado - especifico e acionavel",
                                                                                                                                                    "recadinho_professor": "Recado pessoal breve que a professora escreveria na margem da prova - tom quente e direto, maximo 2 frases",
                                                                                                                                                        "relatorio_pedagogico": "Relatorio narrativo de 3 paragrafos em portugues para uso em conselho de classe ou reuniao de pais."
                                                                                                                                                          }
                                                                                                                                                          }`;
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo nao permitido' });

    try {
          const { imageBase64, imageType, examData, studentName } = req.body;

      if (!imageBase64 || !examData || !studentName) {
              return res.status(400).json({ error: 'Dados incompletos na requisicao' });
      }

      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const message = await client.messages.create({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 2500,
              messages: [{
                        role: 'user',
                        content: [
                          {
                                        type: 'image',
                                        source: {
                                                        type: 'base64',
                                                        media_type: imageType || 'image/jpeg',
                                                        data: imageBase64,
                                        },
                          },
                          {
                                        type: 'text',
                                        text: buildPrompt(examData, studentName),
                          },
                                  ],
              }],
      });

      const text = message.content[0].text;
          const match = text.match(/\{[\s\S]*\}/);
          if (!match) throw new Error('Resposta da IA nao contem JSON valido');

      const result = JSON.parse(match[0]);
          return res.status(200).json(result);

    } catch (err) {
          console.error('Erro na analise:', err);
          return res.status(500).json({ error: 'Erro ao processar analise', detalhe: err.message });
    }
};
