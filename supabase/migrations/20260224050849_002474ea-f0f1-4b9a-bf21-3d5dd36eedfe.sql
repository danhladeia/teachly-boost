
-- Create habilidades_bncc table
CREATE TABLE public.habilidades_bncc (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nivel TEXT NOT NULL, -- 'fundamental_iniciais', 'fundamental_finais', 'ensino_medio'
  disciplina TEXT NOT NULL,
  ano TEXT NOT NULL, -- '1', '2', ..., '9', 'EM'
  unidade_tematica TEXT,
  objeto_conhecimento TEXT,
  descricao TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow public read
ALTER TABLE public.habilidades_bncc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Habilidades BNCC are publicly readable"
ON public.habilidades_bncc FOR SELECT USING (true);

-- Create index for fast lookups
CREATE INDEX idx_habilidades_nivel_disciplina ON public.habilidades_bncc(nivel, disciplina);
CREATE INDEX idx_habilidades_codigo ON public.habilidades_bncc(codigo);

-- =============================================
-- INSERIR HABILIDADES BNCC REAIS
-- =============================================

-- CIÊNCIAS - 1º ANO
INSERT INTO public.habilidades_bncc (codigo, nivel, disciplina, ano, unidade_tematica, objeto_conhecimento, descricao) VALUES
('EF01CI01', 'fundamental_iniciais', 'Ciências', '1', 'Matéria e energia', 'Características dos materiais', 'Comparar características de diferentes materiais presentes em objetos de uso cotidiano, discutindo sua origem, os modos como são descartados e como podem ser usados de forma mais consciente.'),
('EF01CI02', 'fundamental_iniciais', 'Ciências', '1', 'Vida e evolução', 'Corpo humano', 'Localizar, nomear e representar graficamente (por meio de desenhos) partes do corpo humano e explicar suas funções.'),
('EF01CI03', 'fundamental_iniciais', 'Ciências', '1', 'Vida e evolução', 'Corpo humano', 'Discutir as razões pelas quais os hábitos de higiene do corpo (lavar as mãos antes de comer, escovar os dentes, limpar os olhos, o nariz e as orelhas etc.) são necessários para a manutenção da saúde.'),
('EF01CI04', 'fundamental_iniciais', 'Ciências', '1', 'Vida e evolução', 'Corpo humano', 'Comparar características físicas entre os colegas, reconhecendo a diversidade e a importância da valorização, do acolhimento e do respeito às diferenças.'),
('EF01CI05', 'fundamental_iniciais', 'Ciências', '1', 'Terra e Universo', 'Escalas de tempo', 'Identificar e nomear diferentes escalas de tempo: os períodos diários (manhã, tarde, noite) e a sucessão de dias, semanas, meses e anos.'),
('EF01CI06', 'fundamental_iniciais', 'Ciências', '1', 'Terra e Universo', 'Escalas de tempo', 'Selecionar exemplos de como a sucessão de dias e noites orienta o ritmo de atividades diárias de seres humanos e de outros seres vivos.');

-- CIÊNCIAS - 2º ANO
INSERT INTO public.habilidades_bncc (codigo, nivel, disciplina, ano, unidade_tematica, objeto_conhecimento, descricao) VALUES
('EF02CI01', 'fundamental_iniciais', 'Ciências', '2', 'Matéria e energia', 'Propriedades e usos dos materiais', 'Identificar de que materiais (metais, madeira, vidro etc.) são feitos os objetos que fazem parte da vida cotidiana, como esses objetos são utilizados e com quais materiais eram produzidos no passado.'),
('EF02CI02', 'fundamental_iniciais', 'Ciências', '2', 'Matéria e energia', 'Prevenção de acidentes domésticos', 'Propor o uso de diferentes materiais para a construção de objetos de uso cotidiano, tendo em vista algumas propriedades desses materiais (flexibilidade, dureza, transparência etc.).'),
('EF02CI03', 'fundamental_iniciais', 'Ciências', '2', 'Matéria e energia', 'Prevenção de acidentes domésticos', 'Discutir os cuidados necessários à prevenção de acidentes domésticos (objetos cortantes e inflamáveis, eletricidade, produtos de limpeza, medicamentos etc.).'),
('EF02CI04', 'fundamental_iniciais', 'Ciências', '2', 'Vida e evolução', 'Seres vivos no ambiente', 'Descrever características de plantas e animais (tamanho, forma, cor, fase da vida, local onde se desenvolvem etc.) que fazem parte de seu cotidiano e relacioná-las ao ambiente em que eles vivem.'),
('EF02CI05', 'fundamental_iniciais', 'Ciências', '2', 'Vida e evolução', 'Plantas', 'Investigar a importância da água e da luz para a manutenção da vida de plantas em geral.'),
('EF02CI06', 'fundamental_iniciais', 'Ciências', '2', 'Vida e evolução', 'Plantas', 'Identificar as principais partes de uma planta (raiz, caule, folhas, flores e frutos) e a função desempenhada por cada uma delas, e analisar as relações entre as plantas, o ambiente e os demais seres vivos.'),
('EF02CI07', 'fundamental_iniciais', 'Ciências', '2', 'Terra e Universo', 'Movimento aparente do Sol', 'Descrever as posições do Sol em diversos horários do dia e associá-las ao tamanho da sombra projetada.'),
('EF02CI08', 'fundamental_iniciais', 'Ciências', '2', 'Terra e Universo', 'O Sol como fonte de luz e calor', 'Comparar o efeito da radiação solar (luz e calor) em diferentes tipos de superfície (água, areia, solo, superfícies escura, clara e metálica etc.).');

-- CIÊNCIAS - 3º ANO
INSERT INTO public.habilidades_bncc (codigo, nivel, disciplina, ano, unidade_tematica, objeto_conhecimento, descricao) VALUES
('EF03CI01', 'fundamental_iniciais', 'Ciências', '3', 'Matéria e energia', 'Produção de som', 'Produzir diferentes sons a partir da vibração de variados objetos e identificar variáveis que influem nesse fenômeno.'),
('EF03CI02', 'fundamental_iniciais', 'Ciências', '3', 'Matéria e energia', 'Efeitos da luz nos materiais', 'Experimentar e relatar o que ocorre com a passagem da luz através de objetos transparentes (lentes, prismas, água etc.), no contato com superfícies polidas (espelhos) e na intersecção com objetos opacos (formação de sombras).'),
('EF03CI03', 'fundamental_iniciais', 'Ciências', '3', 'Matéria e energia', 'Saúde auditiva e visual', 'Discutir hábitos necessários para a manutenção da saúde auditiva e visual considerando as condições do ambiente em termos de som e luz.'),
('EF03CI04', 'fundamental_iniciais', 'Ciências', '3', 'Vida e evolução', 'Características e desenvolvimento dos animais', 'Identificar características sobre o modo de vida (o que comem, como se reproduzem, como se deslocam etc.) dos animais mais comuns no ambiente próximo.'),
('EF03CI05', 'fundamental_iniciais', 'Ciências', '3', 'Vida e evolução', 'Características e desenvolvimento dos animais', 'Descrever e comunicar as alterações que ocorrem desde o nascimento em animais de diferentes meios terrestres ou aquáticos, inclusive o homem.'),
('EF03CI06', 'fundamental_iniciais', 'Ciências', '3', 'Vida e evolução', 'Características e desenvolvimento dos animais', 'Comparar alguns animais e organizar grupos com base em características externas comuns (presença de penas, pelos, escamas, bico, garras, nadadeiras, patas etc.).'),
('EF03CI07', 'fundamental_iniciais', 'Ciências', '3', 'Terra e Universo', 'Características da Terra', 'Identificar características da Terra (como seu formato esférico, a presença de água, solo etc.), com base na observação, manipulação e comparação de diferentes formas de representação do planeta (mapas, globos, fotografias etc.).'),
('EF03CI08', 'fundamental_iniciais', 'Ciências', '3', 'Terra e Universo', 'Observação do céu', 'Observar, identificar e registrar os períodos diários (dia e noite) em que o Sol, demais estrelas, Lua e planetas estão visíveis no céu.'),
('EF03CI09', 'fundamental_iniciais', 'Ciências', '3', 'Terra e Universo', 'Usos do solo', 'Comparar diferentes amostras de solo do entorno da escola com base em características como cor, textura, cheiro, tamanho das partículas, permeabilidade etc.'),
('EF03CI10', 'fundamental_iniciais', 'Ciências', '3', 'Terra e Universo', 'Usos do solo', 'Identificar os diferentes usos do solo (plantação e extração de materiais, dentre outras possibilidades), reconhecendo a importância do solo para a agricultura e para a vida.');

-- CIÊNCIAS - 4º ANO
INSERT INTO public.habilidades_bncc (codigo, nivel, disciplina, ano, unidade_tematica, objeto_conhecimento, descricao) VALUES
('EF04CI01', 'fundamental_iniciais', 'Ciências', '4', 'Matéria e energia', 'Misturas', 'Identificar misturas na vida diária, com base em suas propriedades físicas observáveis, reconhecendo sua composição.'),
('EF04CI02', 'fundamental_iniciais', 'Ciências', '4', 'Matéria e energia', 'Transformações reversíveis e não reversíveis', 'Testar e relatar transformações nos materiais do dia a dia quando expostos a diferentes condições (aquecimento, resfriamento, luz e umidade).'),
('EF04CI03', 'fundamental_iniciais', 'Ciências', '4', 'Matéria e energia', 'Transformações reversíveis e não reversíveis', 'Concluir que algumas mudanças causadas por aquecimento ou resfriamento são reversíveis (como as mudanças de estado físico da água) e outras não (como o cozimento do ovo, a ## queima do papel etc.).'),
('EF04CI04', 'fundamental_iniciais', 'Ciências', '4', 'Vida e evolução', 'Cadeias alimentares simples', 'Analisar e construir cadeias alimentares simples, reconhecendo a posição ocupada pelos seres vivos nessas cadeias e o papel do Sol como fonte primária de energia na produção de alimentos.'),
('EF04CI05', 'fundamental_iniciais', 'Ciências', '4', 'Vida e evolução', 'Microrganismos', 'Descrever e destacar semelhanças e diferenças entre o ciclo da matéria e o fluxo de energia entre os componentes vivos e não vivos de um ecossistema.'),
('EF04CI06', 'fundamental_iniciais', 'Ciências', '4', 'Vida e evolução', 'Microrganismos', 'Relacionar a participação de fungos e bactérias no processo de decomposição, reconhecendo a importância ambiental desse processo.'),
('EF04CI07', 'fundamental_iniciais', 'Ciências', '4', 'Vida e evolução', 'Microrganismos', 'Verificar a participação de microrganismos na produção de alimentos, combustíveis, medicamentos, entre outros.'),
('EF04CI08', 'fundamental_iniciais', 'Ciências', '4', 'Terra e Universo', 'Pontos cardeais', 'Propor, a partir do conhecimento das formas de propagação da luz, experimentos para verificar a formação de sombras.'),
('EF04CI09', 'fundamental_iniciais', 'Ciências', '4', 'Terra e Universo', 'Calendários, fenômenos cíclicos e cultura', 'Identificar os pontos cardeais, com base no registro de diferentes posições relativas do Sol e da utilização de bússolas.'),
('EF04CI10', 'fundamental_iniciais', 'Ciências', '4', 'Terra e Universo', 'Calendários, fenômenos cíclicos e cultura', 'Comparar as indicações dos pontos cardeais resultantes da observação das sombras de uma vara (gnômon) com aquelas obtidas por meio de uma bússola.'),
('EF04CI11', 'fundamental_iniciais', 'Ciências', '4', 'Terra e Universo', 'Calendários, fenômenos cíclicos e cultura', 'Associar os movimentos cíclicos da Lua e da Terra a períodos de tempo regulares e ao uso desse conhecimento para a construção de calendários em diferentes culturas.');

-- CIÊNCIAS - 5º ANO
INSERT INTO public.habilidades_bncc (codigo, nivel, disciplina, ano, unidade_tematica, objeto_conhecimento, descricao) VALUES
('EF05CI01', 'fundamental_iniciais', 'Ciências', '5', 'Matéria e energia', 'Propriedades físicas dos materiais', 'Explorar fenômenos da vida cotidiana que evidenciem propriedades físicas dos materiais – como densidade, condutibilidade térmica e elétrica, respostas a forças magnéticas, solubilidade, respostas a forças mecânicas (dureza, elasticidade etc.), entre outras.'),
('EF05CI02', 'fundamental_iniciais', 'Ciências', '5', 'Matéria e energia', 'Ciclo hidrológico', 'Aplicar os conhecimentos sobre as mudanças de estado físico da água para explicar o ciclo hidrológico e analisar suas implicações na agricultura, no clima, na geração de energia elétrica, no provimento de água potável e no equilíbrio dos ecossistemas regionais (ou locais).'),
('EF05CI03', 'fundamental_iniciais', 'Ciências', '5', 'Matéria e energia', 'Consumo consciente', 'Selecionar argumentos que justifiquem a importância da cobertura vegetal para a manutenção do ciclo da água, a conservação dos solos, dos cursos de água e da qualidade do ar atmosférico.'),
('EF05CI04', 'fundamental_iniciais', 'Ciências', '5', 'Matéria e energia', 'Reciclagem', 'Identificar os principais usos da água e de outros materiais nas atividades cotidianas para discutir e propor formas sustentáveis de utilização desses recursos.'),
('EF05CI05', 'fundamental_iniciais', 'Ciências', '5', 'Matéria e energia', 'Reciclagem', 'Construir propostas coletivas para um consumo mais consciente e criar soluções tecnológicas para o descarte adequado e a reutilização ou reciclagem de materiais consumidos na escola e/ou na vida cotidiana.'),
('EF05CI06', 'fundamental_iniciais', 'Ciências', '5', 'Vida e evolução', 'Nutrição do organismo', 'Selecionar argumentos que justifiquem por que os sistemas digestório e respiratório são considerados corresponsáveis pelo processo de nutrição do organismo, com base na identificação das funções desses sistemas.'),
('EF05CI07', 'fundamental_iniciais', 'Ciências', '5', 'Vida e evolução', 'Hábitos alimentares', 'Justificar a relação entre o funcionamento do sistema circulatório, a distribuição dos nutrientes pelo organismo e a eliminação dos resíduos produzidos.'),
('EF05CI08', 'fundamental_iniciais', 'Ciências', '5', 'Vida e evolução', 'Integração entre os sistemas', 'Organizar um cardápio equilibrado com base nas características dos grupos alimentares (nutrientes e calorias) e nas necessidades individuais (atividades realizadas, idade, sexo etc.) para a manutenção da saúde do organismo.'),
('EF05CI09', 'fundamental_iniciais', 'Ciências', '5', 'Vida e evolução', 'Integração entre os sistemas', 'Discutir a ocorrência de distúrbios nutricionais (como obesidade, subnutrição etc.) entre crianças e jovens a partir da análise de seus hábitos (tipos e quantidade de alimento ingerido, prática de atividade física etc.).'),
('EF05CI10', 'fundamental_iniciais', 'Ciências', '5', 'Terra e Universo', 'Constelações e mapas celestes', 'Identificar algumas constelações no céu, com o apoio de recursos (como mapas celestes e aplicativos digitais, entre outros), e os períodos do ano em que elas são visíveis no início da noite.'),
('EF05CI11', 'fundamental_iniciais', 'Ciências', '5', 'Terra e Universo', 'Movimento de rotação da Terra', 'Associar o movimento diário do Sol e das demais estrelas no céu ao movimento de rotação da Terra.'),
('EF05CI12', 'fundamental_iniciais', 'Ciências', '5', 'Terra e Universo', 'Periodicidade das fases da Lua', 'Concluir sobre a periodicidade das fases da Lua, com base na observação e no registro das formas aparentes da Lua no céu ao longo de, pelo menos, dois meses.'),
('EF05CI13', 'fundamental_iniciais', 'Ciências', '5', 'Terra e Universo', 'Instrumentos óticos', 'Projetar e construir dispositivos para observação à distância (luneta, periscópio etc.), para ## observação ampliada de objetos (lupas, microscópios) ou para registro de imagens (máquinas fotográficas) e discutir usos sociais desses dispositivos.');

-- CIÊNCIAS - 6º ANO
INSERT INTO public.habilidades_bncc (codigo, nivel, disciplina, ano, unidade_tematica, objeto_conhecimento, descricao) VALUES
('EF06CI01', 'fundamental_finais', 'Ciências', '6', 'Matéria e energia', 'Misturas homogêneas e heterogêneas', 'Classificar como homogênea ou heterogênea a mistura de dois ou mais materiais (água e sal, água e óleo, água e areia etc.).'),
('EF06CI02', 'fundamental_finais', 'Ciências', '6', 'Matéria e energia', 'Separação de materiais', 'Identificar evidências de transformações químicas a partir do resultado de misturas de materiais e da produção de novos materiais.'),
('EF06CI03', 'fundamental_finais', 'Ciências', '6', 'Matéria e energia', 'Separação de materiais', 'Selecionar métodos mais adequados para a separação de diferentes sistemas heterogêneos a partir da identificação de processos de separação de materiais (como a produção de sal de cozinha, a ## ## destilação de petróleo, entre outros).'),
('EF06CI04', 'fundamental_finais', 'Ciências', '6', 'Matéria e energia', 'Transformações químicas', 'Associar a produção de medicamentos e outros materiais sintéticos ao desenvolvimento científico e tecnológico, reconhecendo benefícios e avaliando impactos socioambientais.'),
('EF06CI05', 'fundamental_finais', 'Ciências', '6', 'Vida e evolução', 'Célula como unidade da vida', 'Explicar a organização básica das células e seu papel como unidade estrutural e funcional dos seres vivos.'),
('EF06CI06', 'fundamental_finais', 'Ciências', '6', 'Vida e evolução', 'Célula como unidade da vida', 'Concluir, com base na análise de ilustrações e/ou modelos (físicos ou digitais), que os organismos são um complexo arranjo de sistemas com diferentes níveis de organização.'),
('EF06CI07', 'fundamental_finais', 'Ciências', '6', 'Vida e evolução', 'Interação entre os sistemas locomotor e nervoso', 'Justificar o papel do sistema nervoso na coordenação das ações motoras e sensoriais do corpo, com base na análise de suas estruturas básicas e respectivas funções.'),
('EF06CI08', 'fundamental_finais', 'Ciências', '6', 'Vida e evolução', 'Lentes corretivas', 'Explicar a importância da visão (enxergar e processar as informações visuais) na interação do organismo com o meio e, com base no funcionamento do olho humano, selecionar lentes adequadas para a correção de diferentes defeitos da visão.'),
('EF06CI09', 'fundamental_finais', 'Ciências', '6', 'Vida e evolução', 'Lentes corretivas', 'Deduzir que a estrutura, a sustentação e a movimentação dos animais resultam da interação entre os sistemas muscular, ósseo e nervoso.'),
('EF06CI10', 'fundamental_finais', 'Ciências', '6', 'Vida e evolução', 'Lentes corretivas', 'Explicar como o funcionamento do sistema nervoso pode ser afetado por substâncias psicoativas.'),
('EF06CI11', 'fundamental_finais', 'Ciências', '6', 'Terra e Universo', 'Forma, estrutura e movimentos da Terra', 'Identificar as diferentes camadas que estruturam o planeta Terra (da estrutura interna à atmosfera) e suas principais características.'),
('EF06CI12', 'fundamental_finais', 'Ciências', '6', 'Terra e Universo', 'Forma, estrutura e movimentos da Terra', 'Identificar diferentes tipos de rocha,ite relacionando a formação de fósseis a rochas sedimentares em diferentes períodos geológicos.'),
('EF06CI13', 'fundamental_finais', 'Ciências', '6', 'Terra e Universo', 'Forma, estrutura e movimentos da Terra', 'Selecionar argumentos e evidências que demonstrem a esfericidade da Terra.'),
('EF06CI14', 'fundamental_finais', 'Ciências', '6', 'Terra e Universo', 'Forma, estrutura e movimentos da Terra', 'Inferir que as mudanças na sombra de uma vara (gnômon) ao longo do dia em diferentes períodos do ano são uma evidência dos movimentos relativos entre a Terra e o Sol.');

-- CIÊNCIAS - 7º ANO
INSERT INTO public.habilidades_bncc (codigo, nivel, disciplina, ano, unidade_tematica, objeto_conhecimento, descricao) VALUES
('EF07CI01', 'fundamental_finais', 'Ciências', '7', 'Matéria e energia', 'Máquinas simples', 'Discutir a aplicação, ao longo da história, das máquinas simples e propor soluções e invenções para a realização de tarefas mecânicas cotidianas.'),
('EF07CI02', 'fundamental_finais', 'Ciências', '7', 'Matéria e energia', 'Formas de propagação do calor', 'Diferenciar temperatura, calor e sensação térmica nas diferentes situações de equilíbrio termodinâmico cotidianas.'),
('EF07CI03', 'fundamental_finais', 'Ciências', '7', 'Matéria e energia', 'Equilíbrio termodinâmico', 'Utilizar o conhecimento das formas de propagação do calor para justificar a utilização de determinados materiais (condutores e isolantes) na vida cotidiana.'),
('EF07CI04', 'fundamental_finais', 'Ciências', '7', 'Matéria e energia', 'História dos combustíveis', 'Avaliar o papel do equilíbrio termodinâmico para a manutenção da vida na Terra, para o funcionamento de máquinas térmicas e em outras situações cotidianas.'),
('EF07CI05', 'fundamental_finais', 'Ciências', '7', 'Matéria e energia', 'História dos combustíveis', 'Discutir o uso de diferentes tipos de combustível e máquinas térmicas ao longo do tempo, para avaliar avanços, questões econômicas e impactos socioambientais.'),
('EF07CI06', 'fundamental_finais', 'Ciências', '7', 'Matéria e energia', 'História dos combustíveis', 'Discutir e avaliar mudanças econômicas, culturais e sociais, tanto na vida cotidiana quanto no mundo do trabalho, decorrentes do desenvolvimento de novos materiais e tecnologias.');

-- CIÊNCIAS - 8º ANO
INSERT INTO public.habilidades_bncc (codigo, nivel, disciplina, ano, unidade_tematica, objeto_conhecimento, descricao) VALUES
('EF08CI01', 'fundamental_finais', 'Ciências', '8', 'Matéria e energia', 'Fontes e tipos de energia', 'Identificar e classificar diferentes fontes (renováveis e não renováveis) e tipos de energia utilizados em residências, comunidades ou cidades.'),
('EF08CI02', 'fundamental_finais', 'Ciências', '8', 'Matéria e energia', 'Transformação de energia', 'Construir circuitos elétricos com pilha/bateria, fios e lâmpada ou outros dispositivos e compará-los a circuitos elétricos residenciais.'),
('EF08CI03', 'fundamental_finais', 'Ciências', '8', 'Matéria e energia', 'Cálculo de consumo de energia', 'Classificar equipamentos elétricos residenciais (chuveiro, ferro, lâmpadas, TV, rádio, geladeira etc.) de acordo com o tipo de transformação de energia.'),
('EF08CI04', 'fundamental_finais', 'Ciências', '8', 'Matéria e energia', 'Uso consciente de energia', 'Calcular o consumo de eletrodomésticos a partir dos dados de potência (watts) e tempo de uso (horas) e propor ações de economia de energia.'),
('EF08CI05', 'fundamental_finais', 'Ciências', '8', 'Matéria e energia', 'Uso consciente de energia', 'Propor ações coletivas para otimizar o uso de energia elétrica em sua escola e/ou comunidade, com base na seleção de equipamentos segundo critérios de sustentabilidade.'),
('EF08CI06', 'fundamental_finais', 'Ciências', '8', 'Matéria e energia', 'Uso consciente de energia', 'Discutir e avaliar usinas de geração de energia elétrica (termelétricas, hidrelétricas, eólicas etc.), suas semelhanças e diferenças, seus impactos socioambientais, e como essa energia chega e é usada em sua cidade, comunidade, casa ou escola.'),
('EF08CI07', 'fundamental_finais', 'Ciências', '8', 'Vida e evolução', 'Mecanismos reprodutivos', 'Comparar diferentes processos reprodutivos em plantas e animais em relação aos mecanismos adaptativos e evolutivos.'),
('EF08CI08', 'fundamental_finais', 'Ciências', '8', 'Vida e evolução', 'Sexualidade', 'Analisar e explicar as transformações que ocorrem na puberdade considerando a atuação dos hormônios sexuais e do sistema nervoso.'),
('EF08CI09', 'fundamental_finais', 'Ciências', '8', 'Vida e evolução', 'Sexualidade', 'Comparar o modo de ação e a eficácia dos diversos métodos contraceptivos e justificar a necessidade de compartilhar a responsabilidade na escolha e na utilização do método mais adequado à prevenção da gravidez precoce e indesejada e de Doenças Sexualmente Transmissíveis (DST).'),
('EF08CI10', 'fundamental_finais', 'Ciências', '8', 'Vida e evolução', 'Sexualidade', 'Identificar os principais sintomas, modos de transmissão e tratamento de algumas DST (com ênfase na AIDS), e discutir estratégias e métodos de prevenção.'),
('EF08CI11', 'fundamental_finais', 'Ciências', '8', 'Vida e evolução', 'Sexualidade', 'Selecionar argumentos que evidenciem as múltiplas dimensões da sexualidade humana (biológica, sociocultural, afetiva e ética).'),
('EF08CI12', 'fundamental_finais', 'Ciências', '8', 'Terra e Universo', 'Sistema Sol, Terra e Lua', 'Justificar, por meio da construção de modelos e da observação da Lua no céu, a ocorrência das fases da Lua e dos eclipses, com base nas posições relativas entre Sol, Terra e Lua.'),
('EF08CI13', 'fundamental_finais', 'Ciências', '8', 'Terra e Universo', 'Clima', 'Representar os movimentos de rotação e translação da Terra e analisar o papel da inclinação do eixo de rotação da Terra em relação à sua órbita na ocorrência das estações do ano.'),
('EF08CI14', 'fundamental_finais', 'Ciências', '8', 'Terra e Universo', 'Clima', 'Relacionar climas regionais aos padrões de circulação atmosférica e oceânica e ao aquecimento desigual causado pela forma e pelos movimentos da Terra.'),
('EF08CI15', 'fundamental_finais', 'Ciências', '8', 'Terra e Universo', 'Clima', 'Identificar as principais variáveis envolvidas na previsão do tempo e simular situações nas quais elas possam ser medidas.'),
('EF08CI16', 'fundamental_finais', 'Ciências', '8', 'Terra e Universo', 'Clima', 'Discutir iniciativas que contribuam para restabelecer o equilíbrio ambiental a partir da identificação de alterações climáticas regionais e globais provocadas pela intervenção humana.');

-- CIÊNCIAS - 9º ANO
INSERT INTO public.habilidades_bncc (codigo, nivel, disciplina, ano, unidade_tematica, objeto_conhecimento, descricao) VALUES
('EF09CI01', 'fundamental_finais', 'Ciências', '9', 'Matéria e energia', 'Aspectos quantitativos das transformações químicas', 'Investigar as mudanças de estado físico da matéria e explicar essas transformações com base no modelo de constituição submicroscópica.'),
('EF09CI02', 'fundamental_finais', 'Ciências', '9', 'Matéria e energia', 'Estrutura da matéria', 'Comparar quantidades de reagentes e produtos envolvidos em transformações químicas, estabelecendo a proporção entre as suas massas.'),
('EF09CI03', 'fundamental_finais', 'Ciências', '9', 'Matéria e energia', 'Radiações e suas aplicações', 'Identificar modelos que descrevem a estrutura da matéria (constituição do átomo e composição de moléculas simples) e reconhecer sua evolução histórica.'),
('EF09CI04', 'fundamental_finais', 'Ciências', '9', 'Matéria e energia', 'Radiações e suas aplicações', 'Planejar e executar experimentos que evidenciem que todas as cores de luz podem ser formadas pela composição das três cores primárias da luz e que a cor de um objeto está relacionada também à cor da luz que o ilumina.'),
('EF09CI05', 'fundamental_finais', 'Ciências', '9', 'Matéria e energia', 'Radiações e suas aplicações', 'Investigar os principais mecanismos envolvidos na transmissão e recepção de imagem e som que revolucionaram os sistemas de comunicação humana.'),
('EF09CI06', 'fundamental_finais', 'Ciências', '9', 'Matéria e energia', 'Radiações e suas aplicações', 'Classificar as radiações eletromagnéticas por suas frequências, fontes e aplicações, discutindo e avaliando as implicações de seu uso em controle remoto, telefone celular, raio X, forno de micro-ondas, fotocélulas etc.'),
('EF09CI07', 'fundamental_finais', 'Ciências', '9', 'Matéria e energia', 'Radiações e suas aplicações', 'Discutir o papel do avanço tecnológico na aplicação das radiações na medicina diagnóstica (raio X, ultrassom, ressonância nuclear magnética) e no tratamento de doenças (radioterapia, cirurgia ótica a laser, infravermelho, ultravioleta etc.).'),
('EF09CI08', 'fundamental_finais', 'Ciências', '9', 'Vida e evolução', 'Hereditariedade', 'Associar os gametas à transmissão das características hereditárias, estabelecendo relações entre ancestrais e descendentes.'),
('EF09CI09', 'fundamental_finais', 'Ciências', '9', 'Vida e evolução', 'Hereditariedade', 'Discutir as ideias de Mendel sobre hereditariedade (fatores hereditários, currentCharacterísticas dominantes e recessivas), reconhecendo a importância de seus trabalhos para a genética.'),
('EF09CI10', 'fundamental_finais', 'Ciências', '9', 'Vida e evolução', 'Ideias evolucionistas', 'Comparar as ideias evolucionistas de Lamarck e Darwin apresentadas em textos científicos e históricos, identificando semelhanças e diferenças entre essas ideias e sua importância para explicar a diversidade biológica.'),
('EF09CI11', 'fundamental_finais', 'Ciências', '9', 'Vida e evolução', 'Preservação da biodiversidade', 'Discutir a evolução e a diversidade das espécies com base em diferentes evidências (registros fósseis, comparação de rios anatômicos e fisiológicos entre seres vivos atuais e extintos, entre outras).'),
('EF09CI12', 'fundamental_finais', 'Ciências', '9', 'Terra e Universo', 'Composição, estrutura e localização do Sistema Solar', 'Justificar a importância das unidades de medida padronizadas em diferentes contextos sociais e científicos.'),
('EF09CI13', 'fundamental_finais', 'Ciências', '9', 'Terra e Universo', 'Astronomia e cultura', 'Descrever a composição e a estrutura do Sistema Solar (Sol, planetas rochosos, planetas gigantes gasosos e corpos menores), assim como a localização do Sistema Solar na nossa Galáxia.'),
('EF09CI14', 'fundamental_finais', 'Ciências', '9', 'Terra e Universo', 'Vida humana fora da Terra', 'Descrever a composição e a estrutura do Sistema Solar (Sol, planetas rochosos, planetas gigantes gasosos e corpos menores), assim como a localização do Sistema Solar na nossa Galáxia.'),
('EF09CI15', 'fundamental_finais', 'Ciências', '9', 'Terra e Universo', 'Ordem de grandeza astronômica', 'Relacionar diferentes leituras do céu e explicações sobre a origem da Terra, do Sol ou do Sistema Solar às necessidades de distintas culturas.');

-- MATEMÁTICA - AMOSTRAS POR ANO (1º ao 5º - Iniciais)
INSERT INTO public.habilidades_bncc (codigo, nivel, disciplina, ano, unidade_tematica, objeto_conhecimento, descricao) VALUES
('EF01MA01', 'fundamental_iniciais', 'Matemática', '1', 'Números', 'Contagem', 'Utilizar números naturais como indicador de quantidade ou de ordem em diferentes situações cotidianas e reconhecer situações em que os números não indicam contagem nem ordem, mas sim código de identificação.'),
('EF01MA02', 'fundamental_iniciais', 'Matemática', '1', 'Números', 'Quantificação de elementos', 'Contar de maneira exata ou aproximada, utilizando diferentes estratégias como o pareamento e outros agrupamentos.'),
('EF01MA03', 'fundamental_iniciais', 'Matemática', '1', 'Números', 'Leitura, escrita e comparação de números', 'Estimar e comparar quantidades de objetos de dois conjuntos (em torno de 20 elementos), por estimativa e/ou por correspondência (um a um, dois a dois) para indicar "tem mais", "tem menos" ou "tem a mesma quantidade".'),
('EF01MA04', 'fundamental_iniciais', 'Matemática', '1', 'Números', 'Reta numérica', 'Contar a quantidade de objetos de coleções até 100 unidades e apresentar o resultado por registros verbais e simbólicos, em situações de seu interesse, como jogos, brincadeiras, materiais da sala de aula, entre outros.'),
('EF01MA05', 'fundamental_iniciais', 'Matemática', '1', 'Números', 'Reta numérica', 'Comparar números naturais de até duas ordens em situações cotidianas, com e sem suporte da reta numérica.'),
('EF02MA01', 'fundamental_iniciais', 'Matemática', '2', 'Números', 'Leitura, escrita, comparação e ordenação', 'Comparar e ordenar números naturais (até a ordem de centenas) pela compreensão de características do sistema de numeração decimal (valor posicional e função do zero).'),
('EF02MA02', 'fundamental_iniciais', 'Matemática', '2', 'Números', 'Composição e decomposição', 'Fazer estimativas por meio de estratégias diversas a respeito da quantidade de objetos de coleções e registrar o resultado da contagem desses objetos (até 1000 unidades).'),
('EF02MA03', 'fundamental_iniciais', 'Matemática', '2', 'Números', 'Composição e decomposição', 'Comparar quantidades de objetos de dois conjuntos, por estimativa e/ou por correspondência (um a um, dois a dois, entre outros), para indicar "tem mais", "tem menos" ou "tem a mesma quantidade", indicando, quando for o caso, quantos a mais e quantos a menos.'),
('EF03MA01', 'fundamental_iniciais', 'Matemática', '3', 'Números', 'Leitura, escrita, comparação e ordenação', 'Ler, escrever e comparar números naturais de até a ordem de unidade de milhar, estabelecendo relações entre os registros numéricos e em língua materna.'),
('EF03MA02', 'fundamental_iniciais', 'Matemática', '3', 'Números', 'Adição e subtração', 'Identificar características do sistema de numeração decimal, utilizando a composição e a decomposição de número natural de até quatro ordens.'),
('EF04MA01', 'fundamental_iniciais', 'Matemática', '4', 'Números', 'Sistema de numeração decimal', 'Ler, escrever e ordenar números naturais até a ordem de dezenas de milhar.'),
('EF04MA02', 'fundamental_iniciais', 'Matemática', '4', 'Números', 'Composição e decomposição', 'Mostrar, por decomposição e composição, que todo número natural pode ser escrito por meio de adições e multiplicações por potências de dez.'),
('EF04MA03', 'fundamental_iniciais', 'Matemática', '4', 'Números', 'Operações', 'Resolver e elaborar problemas com números naturais envolvendo adição e subtração, utilizando estratégias diversas, como cálculo, cálculo mental e algoritmos, além de fazer estimativas do resultado.'),
('EF05MA01', 'fundamental_iniciais', 'Matemática', '5', 'Números', 'Sistema de numeração decimal', 'Ler, escrever e ordenar números naturais até a ordem das centenas de milhar com compreensão das principais características do sistema de numeração decimal.'),
('EF05MA02', 'fundamental_iniciais', 'Matemática', '5', 'Números', 'Representação fracionária', 'Ler, escrever e ordenar números racionais na forma decimal com compreensão das principais características do sistema de numeração decimal, utilizando, como recursos, a composição e decomposição e a reta numérica.'),
('EF05MA03', 'fundamental_iniciais', 'Matemática', '5', 'Números', 'Problemas', 'Identificar e representar frações (menores e maiores que a unidade), associando-as ao resultado de uma divisão ou à ideia de parte de um todo, utilizando a reta numérica como recurso.');

-- MATEMÁTICA - 6º ao 9º ANO (Finais) - amostras
INSERT INTO public.habilidades_bncc (codigo, nivel, disciplina, ano, unidade_tematica, objeto_conhecimento, descricao) VALUES
('EF06MA01', 'fundamental_finais', 'Matemática', '6', 'Números', 'Sistema de numeração decimal', 'Comparar, ordenar, ler e escrever números naturais e números racionais cuja representação decimal é finita, fazendo uso da reta numérica.'),
('EF06MA02', 'fundamental_finais', 'Matemática', '6', 'Números', 'Operações com números naturais', 'Reconhecer o sistema de numeração decimal, como o que prevaleceu no mundo ocidental, e destacar semelhanças e diferenças com outros sistemas.'),
('EF06MA03', 'fundamental_finais', 'Matemática', '6', 'Números', 'Frações', 'Resolver e elaborar problemas que envolvam cálculos (mentais ou escritos, exatos ou aproximados) com números naturais, por meio de estratégias variadas.'),
('EF07MA01', 'fundamental_finais', 'Matemática', '7', 'Números', 'Números inteiros', 'Resolver e elaborar problemas com números naturais, envolvendo as noções de divisor e de múltiplo.'),
('EF07MA02', 'fundamental_finais', 'Matemática', '7', 'Números', 'Números racionais', 'Resolver e elaborar problemas que envolvam porcentagens, como os que lidam com acréscimos e decréscimos simples, utilizando estratégias pessoais, cálculo mental e calculadora, no contexto de educação financeira, entre outros.'),
('EF08MA01', 'fundamental_finais', 'Matemática', '8', 'Números', 'Notação científica', 'Efetuar cálculos com potências de expoentes inteiros e aplicar esse conhecimento na representação de números em notação científica.'),
('EF08MA02', 'fundamental_finais', 'Matemática', '8', 'Números', 'Potenciação e radiciação', 'Resolver e elaborar problemas usando a relação entre potenciação e radiciação, para representar raízes de quadrados perfeitos até 225 e raízes cúbicas perfeitas até 1000.'),
('EF09MA01', 'fundamental_finais', 'Matemática', '9', 'Números', 'Necessidade dos números reais', 'Reconhecer que, uma vez fixada uma unidade de comprimento, existem segmentos de reta cujo comprimento não é expresso por número racional.'),
('EF09MA02', 'fundamental_finais', 'Matemática', '9', 'Números', 'Números reais', 'Reconhecer um número irracional como um número real cuja representação decimal é infinita e não periódica, e estimar a localização de alguns deles na reta numérica.');

-- HISTÓRIA - amostras
INSERT INTO public.habilidades_bncc (codigo, nivel, disciplina, ano, unidade_tematica, objeto_conhecimento, descricao) VALUES
('EF01HI01', 'fundamental_iniciais', 'História', '1', 'Mundo pessoal: meu lugar no mundo', 'As fases da vida', 'Identificar aspectos do seu crescimento por meio do registro das lembranças particulares ou de lembranças dos membros de sua família e/ou de sua comunidade.'),
('EF01HI02', 'fundamental_iniciais', 'História', '1', 'Mundo pessoal: meu lugar no mundo', 'As fases da vida', 'Identificar a relação entre as suas histórias e as histórias de sua família e de sua comunidade.'),
('EF02HI01', 'fundamental_iniciais', 'História', '2', 'A comunidade e seus registros', 'A noção do "Eu"', 'Reconhecer espaços de sociabilidade e identificar os motivos que aproximam e separam as pessoas em diferentes grupos sociais ou de parentesco.'),
('EF03HI01', 'fundamental_iniciais', 'História', '3', 'As pessoas e os grupos', 'O "Eu", o "Outro" e os diferentes grupos sociais', 'Identificar os grupos populacionais que formam a cidade, o município e a região, as relações estabelecidas entre eles e os eventos que marcam a formação da cidade.'),
('EF04HI01', 'fundamental_iniciais', 'História', '4', 'Transformações e permanências', 'A ação das pessoas, grupos sociais e comunidades no tempo', 'Reconhecer a história como resultado da ação do ser humano no tempo e no espaço, com base na identificação de mudanças e permanências ao longo do tempo.'),
('EF05HI01', 'fundamental_iniciais', 'História', '5', 'Povos e culturas', 'O que forma um povo', 'Identificar os processos de formação das culturas e dos povos, relacionando-os com o espaço geográfico ocupado.'),
('EF06HI01', 'fundamental_finais', 'História', '6', 'História: tempo, espaço e formas de registros', 'A questão do tempo em História', 'Identificar diferentes formas de compreensão da noção de tempo e de periodização dos processos históricos (continuidades e rupturas).'),
('EF06HI14', 'fundamental_finais', 'História', '6', 'Trabalho e formas de organização social e cultural', 'O Ocidente Clássico', 'Diferenciar escravidão, servidão e trabalho livre no mundo antigo.'),
('EF07HI01', 'fundamental_finais', 'História', '7', 'O mundo moderno e a conexão entre sociedades', 'A construção da ideia de modernidade', 'Explicar o significado de "modernidade" e suas lógicas de inclusão e exclusão, com base em uma concepção europeia.'),
('EF08HI01', 'fundamental_finais', 'História', '8', 'O século XIX e o cenário brasileiro', 'A Revolução Francesa', 'Identificar os principais aspectos conceituais do iluminismo e do liberalismo e discutir a relação entre eles e a organização do mundo contemporâneo.'),
('EF09HI01', 'fundamental_finais', 'História', '9', 'O nascimento da República no Brasil', 'Experiências republicanas', 'Descrever e contextualizar os principais aspectos sociais, culturais, econômicos e políticos da emergência da República no Brasil.');

-- GEOGRAFIA - amostras
INSERT INTO public.habilidades_bncc (codigo, nivel, disciplina, ano, unidade_tematica, objeto_conhecimento, descricao) VALUES
('EF01GE01', 'fundamental_iniciais', 'Geografia', '1', 'O sujeito e seu lugar no mundo', 'O modo de vida das crianças', 'Descrever características observadas de seus lugares de vivência (moradia, escola etc.) e identificar semelhanças e diferenças entre esses lugares.'),
('EF02GE01', 'fundamental_iniciais', 'Geografia', '2', 'O sujeito e seu lugar no mundo', 'Convivência e interações', 'Descrever a história das migrações no bairro ou comunidade em que vive.'),
('EF03GE01', 'fundamental_iniciais', 'Geografia', '3', 'O sujeito e seu lugar no mundo', 'A cidade e o campo', 'Identificar e comparar aspectos culturais dos grupos sociais de seus lugares de vivência.'),
('EF04GE01', 'fundamental_iniciais', 'Geografia', '4', 'O sujeito e seu lugar no mundo', 'Território e diversidade cultural', 'Selecionar, em seus lugares de vivência e em suas histórias familiares e/ou da comunidade, elementos de distintas culturas.'),
('EF05GE01', 'fundamental_iniciais', 'Geografia', '5', 'O sujeito e seu lugar no mundo', 'Dinâmica populacional', 'Descrever e analisar dinâmicas populacionais na Unidade da Federação em que vive, estabelecendo relações entre migrações e condições de infraestrutura.'),
('EF06GE01', 'fundamental_finais', 'Geografia', '6', 'O sujeito e seu lugar no mundo', 'Identidade sociocultural', 'Comparar modificações das paisagens nos lugares de vivência e os usos desses lugares em diferentes tempos.'),
('EF07GE01', 'fundamental_finais', 'Geografia', '7', 'O sujeito e seu lugar no mundo', 'Ideias e concepções sobre a formação territorial do Brasil', 'Avaliar, por meio de exemplos extraídos dos meios de comunicação, ideias e estereótipos acerca das paisagens e da formação territorial do Brasil.'),
('EF08GE01', 'fundamental_finais', 'Geografia', '8', 'O sujeito e seu lugar no mundo', 'Distribuição da população mundial', 'Descrever as rotas de dispersão da população humana pelo planeta e os principais fluxos migratórios em diferentes períodos da história, discutindo os fatores históricos e condicionantes físico-naturais associados à distribuição da população humana.'),
('EF09GE01', 'fundamental_finais', 'Geografia', '9', 'O sujeito e seu lugar no mundo', 'A hegemonia europeia na economia, na política e na cultura', 'Analisar criticamente de que forma a hegemonia europeia foi exercida em várias regiões do planeta, notadamente em situações de conflito, intervenções militares e/ou influência cultural em diferentes tempos e lugares.');

-- LÍNGUA PORTUGUESA - amostras
INSERT INTO public.habilidades_bncc (codigo, nivel, disciplina, ano, unidade_tematica, objeto_conhecimento, descricao) VALUES
('EF15LP01', 'fundamental_iniciais', 'Língua Portuguesa', '1-5', 'Oralidade', 'Oralidade pública/Intercâmbio conversacional', 'Identificar a função social de textos que circulam em campos da vida social dos quais participa cotidianamente.'),
('EF15LP02', 'fundamental_iniciais', 'Língua Portuguesa', '1-5', 'Oralidade', 'Escuta atenta', 'Estabelecer expectativas em relação ao texto que vai ler (pressuposições antecipadoras dos sentidos).'),
('EF15LP03', 'fundamental_iniciais', 'Língua Portuguesa', '1-5', 'Oralidade', 'Relato oral/Registro formal e informal', 'Localizar informações explícitas em textos.'),
('EF15LP04', 'fundamental_iniciais', 'Língua Portuguesa', '1-5', 'Leitura/escuta', 'Estratégia de leitura', 'Identificar o efeito de sentido produzido pelo uso de recursos expressivos gráfico-visuais em textos multissemióticos.'),
('EF69LP01', 'fundamental_finais', 'Língua Portuguesa', '6-9', 'Leitura', 'Reconstrução do contexto de produção', 'Diferenciar liberdade de expressão de discursos de ódio, posicionando-se contrariamente a esse tipo de discurso e vislumbrando possibilidades de denúncia quando for o caso.'),
('EF69LP02', 'fundamental_finais', 'Língua Portuguesa', '6-9', 'Leitura', 'Relação entre textos', 'Analisar e comparar peças publicitárias variadas, identificando o público-alvo, o apelo ao consumo e os recursos utilizados.'),
('EF69LP03', 'fundamental_finais', 'Língua Portuguesa', '6-9', 'Leitura', 'Estratégia de leitura', 'Identificar, em notícias, o fato central, suas principais circunstâncias e eventuais decorrências.');

-- ARTE - amostras
INSERT INTO public.habilidades_bncc (codigo, nivel, disciplina, ano, unidade_tematica, objeto_conhecimento, descricao) VALUES
('EF15AR01', 'fundamental_iniciais', 'Arte', '1-5', 'Artes visuais', 'Contextos e práticas', 'Identificar e apreciar formas distintas das artes visuais tradicionais e contemporâneas, cultivando a percepção, o imaginário, a capacidade de simbolizar e o repertório imagético.'),
('EF15AR02', 'fundamental_iniciais', 'Arte', '1-5', 'Artes visuais', 'Elementos da linguagem', 'Explorar e reconhecer elementos constitutivos das artes visuais (ponto, linha, forma, cor, espaço, movimento etc.).'),
('EF69AR01', 'fundamental_finais', 'Arte', '6-9', 'Artes visuais', 'Contextos e práticas', 'Pesquisar, apreciar e analisar formas distintas das artes visuais tradicionais e contemporâneas, em obras de artistas brasileiros e estrangeiros de diferentes épocas e em diferentes matrizes estéticas e culturais.'),
('EF69AR02', 'fundamental_finais', 'Arte', '6-9', 'Artes visuais', 'Contextos e práticas', 'Pesquisar e analisar diferentes estilos visuais, contextualizando-os no tempo e no espaço.');

-- EDUCAÇÃO FÍSICA - amostras
INSERT INTO public.habilidades_bncc (codigo, nivel, disciplina, ano, unidade_tematica, objeto_conhecimento, descricao) VALUES
('EF12EF01', 'fundamental_iniciais', 'Educação Física', '1-2', 'Brincadeiras e jogos', 'Brincadeiras e jogos da cultura popular', 'Experimentar, fruir e recriar diferentes brincadeiras e jogos da cultura popular presentes no contexto comunitário e regional, reconhecendo e respeitando as diferenças individuais de desempenho dos colegas.'),
('EF12EF02', 'fundamental_iniciais', 'Educação Física', '1-2', 'Brincadeiras e jogos', 'Brincadeiras e jogos da cultura popular', 'Explicar, por meio de múltiplas linguagens (corporal, visual, oral e escrita), as brincadeiras e os jogos populares do contexto comunitário e regional, reconhecendo e valorizando a importância desses jogos e brincadeiras para suas culturas de origem.'),
('EF35EF01', 'fundamental_iniciais', 'Educação Física', '3-5', 'Brincadeiras e jogos', 'Brincadeiras e jogos populares do Brasil e do mundo', 'Experimentar e fruir brincadeiras e jogos populares do Brasil e do mundo, incluindo aqueles de matriz indígena e africana, e recriá-los, valorizando a importância desse patrimônio histórico cultural.'),
('EF67EF01', 'fundamental_finais', 'Educação Física', '6-7', 'Brincadeiras e jogos', 'Jogos eletrônicos', 'Experimentar e fruir, na escola e fora dela, jogos eletrônicos diversificados, valorizando e respeitando os sentidos e significados atribuídos a eles por diferentes grupos sociais e etários.');

-- ENSINO RELIGIOSO - amostras
INSERT INTO public.habilidades_bncc (codigo, nivel, disciplina, ano, unidade_tematica, objeto_conhecimento, descricao) VALUES
('EF01ER01', 'fundamental_iniciais', 'Ensino Religioso', '1', 'Identidades e alteridades', 'O eu, o outro e o nós', 'Identificar e acolher as semelhanças e diferenças entre o eu, o outro e o nós.'),
('EF01ER02', 'fundamental_iniciais', 'Ensino Religioso', '1', 'Identidades e alteridades', 'Imanência e transcendência', 'Reconhecer que o seu nome e o das demais pessoas os identificam e os diferenciam.'),
('EF02ER01', 'fundamental_iniciais', 'Ensino Religioso', '2', 'Identidades e alteridades', 'O eu, a família e o ambiente de convivência', 'Reconhecer os diferentes espaços de convivência.'),
('EF06ER01', 'fundamental_finais', 'Ensino Religioso', '6', 'Crenças religiosas e filosofias de vida', 'Tradição oral e tradição escrita', 'Reconhecer o papel da tradição escrita na preservação de memórias, acontecimentos e ensinamentos religiosos.');

-- LÍNGUA INGLESA - amostras (6º ao 9º)
INSERT INTO public.habilidades_bncc (codigo, nivel, disciplina, ano, unidade_tematica, objeto_conhecimento, descricao) VALUES
('EF06LI01', 'fundamental_finais', 'Língua Inglesa', '6', 'Oralidade', 'Construção de laços afetivos e convívio social', 'Interagir em situações de intercâmbio oral, demonstrando iniciativa para utilizar a língua inglesa.'),
('EF06LI02', 'fundamental_finais', 'Língua Inglesa', '6', 'Oralidade', 'Funções e usos da língua inglesa', 'Coletar informações do grupo, perguntando e respondendo sobre a família, os amigos, a escola e a comunidade.'),
('EF07LI01', 'fundamental_finais', 'Língua Inglesa', '7', 'Oralidade', 'Interação discursiva', 'Interagir em situações de intercâmbio oral para realizar as atividades em sala de aula, de forma respeitosa e colaborativa, trocando ideias e engajando-se em brincadeiras e jogos.'),
('EF08LI01', 'fundamental_finais', 'Língua Inglesa', '8', 'Oralidade', 'Negociação de sentidos', 'Fazer uso da língua inglesa para resolver mal-entendidos, emitir opiniões e esclarecer informações por meio de paráfrases ou justificativas.'),
('EF09LI01', 'fundamental_finais', 'Língua Inglesa', '9', 'Oralidade', 'Funções e usos da língua inglesa', 'Fazer uso da língua inglesa para expor pontos de vista, argumentos e contra-argumentos, considerando o contexto e os recursos linguísticos voltados para a eficácia da comunicação.');

-- ENSINO MÉDIO - Habilidades por área
INSERT INTO public.habilidades_bncc (codigo, nivel, disciplina, ano, unidade_tematica, objeto_conhecimento, descricao) VALUES
-- Linguagens e suas Tecnologias
('EM13LGG101', 'ensino_medio', 'Linguagens e suas Tecnologias', 'EM', 'Competência 1', 'Linguagens', 'Compreender e analisar processos de produção e circulação de discursos, nas diferentes linguagens, para fazer escolhas fundamentadas em função de interesses pessoais e coletivos.'),
('EM13LGG102', 'ensino_medio', 'Linguagens e suas Tecnologias', 'EM', 'Competência 1', 'Linguagens', 'Analisar visões de mundo, conflitos de interesse, preconceitos e ideologias presentes nos discursos veiculados nas diferentes mídias, ampliando suas possibilidades de explicação, interpretação e intervenção crítica da/na realidade.'),
('EM13LGG103', 'ensino_medio', 'Linguagens e suas Tecnologias', 'EM', 'Competência 1', 'Linguagens', 'Analisar o funcionamento das linguagens, para interpretar e produzir criticamente discursos em textos de diversas semioses (visuais, verbais, sonoras, gestuais).'),
('EM13LGG201', 'ensino_medio', 'Linguagens e suas Tecnologias', 'EM', 'Competência 2', 'Linguagens', 'Utilizar as diversas linguagens (artísticas, corporais e verbais) em diferentes contextos, valorizando-as como fenômeno social, cultural, histórico, variável, heterogêneo e sensível aos contextos de uso.'),
('EM13LGG301', 'ensino_medio', 'Linguagens e suas Tecnologias', 'EM', 'Competência 3', 'Linguagens', 'Participar de processos de produção individual e colaborativa em diferentes linguagens (artísticas, corporais e verbais), levando em conta suas formas e seus funcionamentos, para produzir sentidos em diferentes contextos.'),
('EM13LGG401', 'ensino_medio', 'Linguagens e suas Tecnologias', 'EM', 'Competência 4', 'Linguagens', 'Analisar criticamente textos de modo a compreender e caracterizar as línguas como fenômeno (geo)político, histórico, social, variável, heterogêneo e sensível aos contextos de uso.'),
-- Língua Portuguesa EM
('EM13LP01', 'ensino_medio', 'Língua Portuguesa', 'EM', 'Campo da vida pessoal', 'Práticas de linguagem', 'Relacionar o texto, tanto na produção como na leitura/escuta, com suas condições de produção e seu contexto sócio-histórico de circulação.'),
('EM13LP02', 'ensino_medio', 'Língua Portuguesa', 'EM', 'Campo da vida pessoal', 'Análise linguística/semiótica', 'Estabelecer relações entre as partes do texto, tanto na produção como na leitura/escuta, considerando a construção composicional e o estilo do gênero, usando/reconhecendo adequadamente elementos e recursos coesivos diversos que contribuam para a coerência, a continuidade do texto e sua progressão temática.'),
-- Matemática e suas Tecnologias
('EM13MAT101', 'ensino_medio', 'Matemática', 'EM', 'Competência 1', 'Números e Álgebra', 'Interpretar criticamente situações econômicas, sociais e fatos relativos às Ciências da Natureza que envolvam a variação de grandezas, pela análise dos gráficos das funções representadas e das taxas de variação.'),
('EM13MAT102', 'ensino_medio', 'Matemática', 'EM', 'Competência 1', 'Números e Álgebra', 'Analisar tabelas, gráficos e amostras de pesquisas estatísticas apresentadas em relatórios divulgados por diferentes meios de comunicação, identificando, quando for o caso, inadequações que possam induzir a erros de interpretação.'),
('EM13MAT201', 'ensino_medio', 'Matemática', 'EM', 'Competência 2', 'Geometria e Medidas', 'Propor ou participar de ações adequadas voltadas à melhoria da qualidade de vida, com base em dados e informações sobre a saúde, alimentação, medicina, segurança, meio ambiente, tecnologias, economia ou outros temas relevantes.'),
('EM13MAT301', 'ensino_medio', 'Matemática', 'EM', 'Competência 3', 'Grandezas e Medidas', 'Resolver e elaborar problemas do cotidiano, da Matemática e de outras áreas do conhecimento, que envolvem equações lineares simultâneas, usando técnicas algébricas e gráficas, com ou sem apoio de tecnologias digitais.'),
-- Ciências da Natureza e suas Tecnologias
('EM13CNT101', 'ensino_medio', 'Ciências da Natureza e suas Tecnologias', 'EM', 'Competência 1', 'Matéria e Energia', 'Analisar e representar, com ou sem o uso de dispositivos e de aplicativos digitais específicos, as transformações e conservações em sistemas que envolvam quantidade de matéria, de energia e de movimento para realizar previsões sobre seus comportamentos em situações cotidianas e em processos produtivos que priorizem o desenvolvimento sustentável.'),
('EM13CNT102', 'ensino_medio', 'Ciências da Natureza e suas Tecnologias', 'EM', 'Competência 1', 'Matéria e Energia', 'Realizar previsões, avaliar intervenções e/ou construir protótipos de sistemas térmicos que visem à sustentabilidade.'),
('EM13CNT201', 'ensino_medio', 'Ciências da Natureza e suas Tecnologias', 'EM', 'Competência 2', 'Vida, Terra e Cosmos', 'Analisar e discutir modelos, teorias e leis propostos em diferentes épocas e culturas para comparar distintas explicações sobre o surgimento e a evolução da Vida, da Terra e do Universo.'),
('EM13CNT301', 'ensino_medio', 'Ciências da Natureza e suas Tecnologias', 'EM', 'Competência 3', 'Tecnologia e Sociedade', 'Construir questões, elaborar hipóteses, previsões e estimativas, empregar instrumentos de medição e representar e interpretar modelos explicativos, dados e/ou resultados experimentais para construir, avaliar e justificar conclusões no enfrentamento de situações-problema.'),
-- Ciências Humanas e Sociais Aplicadas
('EM13CHS101', 'ensino_medio', 'Ciências Humanas e Sociais Aplicadas', 'EM', 'Competência 1', 'Tempo e Espaço', 'Identificar, analisar e comparar diferentes fontes e narrativas expressas em diversas linguagens, com vistas à compreensão de ideias filosóficas e de processos e eventos históricos, geográficos, políticos, econômicos, sociais, ambientais e culturais.'),
('EM13CHS102', 'ensino_medio', 'Ciências Humanas e Sociais Aplicadas', 'EM', 'Competência 1', 'Tempo e Espaço', 'Identificar, analisar e discutir as circunstâncias históricas, geográficas, políticas, econômicas, sociais, ambientais e culturais de matrizes conceituais (etnocentrismo, racismo, evolução, modernidade, cooperativismo/desenvolvimento etc.), avaliando criticamente seu significado histórico e comparando-as a narrativas que contemplem outros agentes e discursos.'),
('EM13CHS201', 'ensino_medio', 'Ciências Humanas e Sociais Aplicadas', 'EM', 'Competência 2', 'Política e Trabalho', 'Analisar e caracterizar as dinâmicas das populações, das mercadorias e do capital nos diversos continentes, com destaque para a mobilidade e a fixação de pessoas, grupos humanos e povos, em função de eventos naturais, políticos, econômicos, sociais, religiosos e culturais, de modo a compreender e posicionar-se criticamente em relação a esses processos e às possíveis relações entre eles.');
