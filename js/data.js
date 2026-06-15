/**
 * data.js — Fonte de dados das disciplinas
 *
 * ESTRUTURA DE CADA DISCIPLINA:
 * {
 *   id:          string  — identificador único
 *   codigo:      string  — código da disciplina (ex: "MAT101")
 *   nome:        string  — nome completo
 *   area:        string  — área do conhecimento
 *   cargaHoraria:string  — ex: "60h"
 *   periodo:     string  — ex: "1º Semestre"
 *   professor:   string  — nome do responsável
 *   status:      string  — "ativo" | "inativo" | "revisao"
 *   ementa:      string  — texto da ementa
 *   objetivos:   string  — objetivos gerais e específicos
 *   conteudo:    string[] — lista de tópicos do conteúdo programático
 *   bibliografia: {
 *     basica:        string[]  — referências básicas
 *     complementar:  string[]  — referências complementares
 *   }
 *   cursos:      string[]  — cursos que utilizam esta disciplina
 *   obs:         string   — observações adicionais (opcional)
 *   updatedAt:   string   — data da última atualização (ISO)
 * }
 *
 * ─────────────────────────────────────────────────────────────────
 *  INTEGRAÇÃO FUTURA COM BANCO DE DADOS:
 *  Substitua a constante `disciplinas` abaixo por uma chamada à sua
 *  API REST ou função Supabase, mantendo o mesmo formato de objeto.
 *  Exemplo:
 *
 *    const res = await fetch('/api/disciplinas');
 *    window.disciplinas = await res.json();
 *
 *  Ou com Supabase:
 *    const { data } = await supabase.from('disciplinas').select('*');
 *    window.disciplinas = data;
 * ─────────────────────────────────────────────────────────────────
 */

window.disciplinas = [
  {
    id: "disc-001",
    codigo: "MAT101",
    nome: "Cálculo Diferencial e Integral I",
    area: "Ciências Exatas",
    cargaHoraria: "80h",
    periodo: "1º Semestre",
    professor: "Prof. Dr. Carlos Mendes",
    status: "ativo",
    ementa: "Estudo dos fundamentos do cálculo diferencial e integral de funções reais de uma variável, com ênfase em limites, derivadas e integrais e suas aplicações.",
    objetivos: "Capacitar o aluno a compreender e aplicar os conceitos fundamentais de limite, derivada e integral. Desenvolver o raciocínio lógico-matemático e a habilidade de modelagem de problemas reais.",
    conteudo: [
      "Números reais e funções reais de variável real",
      "Limites e continuidade",
      "Derivadas: definição e regras de derivação",
      "Aplicações das derivadas (otimização, taxas relacionadas)",
      "Integral indefinida e técnicas de integração",
      "Integral definida e o Teorema Fundamental do Cálculo",
      "Aplicações da integral (área, volume, comprimento de arco)"
    ],
    bibliografia: {
      basica: [
        "STEWART, James. Cálculo. 8. ed. São Paulo: Cengage Learning, 2016. 2 v.",
        "GUIDORIZZI, Hamilton Luiz. Um curso de cálculo. 5. ed. Rio de Janeiro: LTC, 2018. 4 v.",
        "LEITHOLD, Louis. O cálculo com geometria analítica. 3. ed. São Paulo: Harbra, 1994. 2 v."
      ],
      complementar: [
        "ANTON, Howard; BIVENS, Irl; DAVIS, Stephen. Cálculo. 10. ed. Porto Alegre: Bookman, 2014. 2 v.",
        "THOMAS, George B. Cálculo. 12. ed. São Paulo: Pearson, 2012. 2 v."
      ]
    },
    cursos: ["Engenharia Civil", "Engenharia de Computação", "Matemática", "Física"],
    obs: "",
    updatedAt: "2024-03-15T10:00:00Z"
  },
  {
    id: "disc-002",
    codigo: "CC201",
    nome: "Algoritmos e Estruturas de Dados",
    area: "Computação",
    cargaHoraria: "60h",
    periodo: "2º Semestre",
    professor: "Prof. Dra. Ana Ribeiro",
    status: "ativo",
    ementa: "Estudo de algoritmos e estruturas de dados fundamentais para resolução de problemas computacionais, incluindo análise de complexidade, recursão, listas, árvores e grafos.",
    objetivos: "Desenvolver a capacidade de analisar problemas e propor soluções algorítmicas eficientes. Compreender as principais estruturas de dados e sua aplicabilidade em diferentes contextos.",
    conteudo: [
      "Introdução a algoritmos e análise de complexidade (Big O)",
      "Recursão e backtracking",
      "Arrays, listas ligadas e pilhas",
      "Filas e deques",
      "Árvores binárias e árvores de busca",
      "Tabelas hash",
      "Grafos: representação e algoritmos de busca (BFS, DFS)",
      "Algoritmos de ordenação: QuickSort, MergeSort, HeapSort"
    ],
    bibliografia: {
      basica: [
        "CORMEN, Thomas H. et al. Algoritmos: teoria e prática. 3. ed. Rio de Janeiro: Elsevier, 2012.",
        "SEDGEWICK, Robert; WAYNE, Kevin. Algorithms. 4. ed. Upper Saddle River: Addison-Wesley, 2011.",
        "ZIVIANI, Nivio. Projeto de algoritmos com implementações em Java e C++. São Paulo: Cengage Learning, 2010."
      ],
      complementar: [
        "SKIENA, Steven S. The algorithm design manual. 2. ed. New York: Springer, 2008.",
        "KNUTH, Donald E. The art of computer programming. 3. ed. Reading: Addison-Wesley, 1998. 4 v."
      ]
    },
    cursos: ["Ciência da Computação", "Engenharia de Computação", "Sistemas de Informação"],
    obs: "Recomenda-se que o aluno tenha conhecimento básico de programação antes de cursar esta disciplina.",
    updatedAt: "2024-04-01T08:30:00Z"
  },
  {
    id: "disc-003",
    codigo: "PED301",
    nome: "Didática do Ensino Superior",
    area: "Educação",
    cargaHoraria: "40h",
    periodo: "3º Semestre",
    professor: "Profa. Dra. Mariana Souza",
    status: "ativo",
    ementa: "Fundamentos teórico-metodológicos da didática aplicada ao ensino superior. Planejamento de ensino, metodologias ativas, avaliação da aprendizagem e gestão de sala de aula.",
    objetivos: "Proporcionar ao discente o domínio dos princípios e práticas pedagógicas necessários ao exercício da docência no ensino superior, com ênfase em metodologias ativas e avaliação formativa.",
    conteudo: [
      "Fundamentos históricos e filosóficos da didática",
      "O papel do professor no ensino superior contemporâneo",
      "Planejamento pedagógico: plano de curso e plano de aula",
      "Metodologias ativas: aprendizagem baseada em problemas e em projetos",
      "Tecnologias digitais na educação superior",
      "Avaliação formativa e somativa",
      "Gestão de sala de aula e mediação de conflitos",
      "Inclusão e diversidade no ensino superior"
    ],
    bibliografia: {
      basica: [
        "MASETTO, Marcos T. Competência pedagógica do professor universitário. 2. ed. São Paulo: Summus, 2012.",
        "ANASTASIOU, Lea das Graças; ALVES, Leonir Pessate (org.). Processos de ensinagem na universidade. 10. ed. Joinville: Univille, 2015.",
        "LIBÂNEO, José Carlos. Didática. 2. ed. São Paulo: Cortez, 2013."
      ],
      complementar: [
        "FREIRE, Paulo. Pedagogia da autonomia. 52. ed. Rio de Janeiro: Paz e Terra, 2015.",
        "PERRENOUD, Philippe. Dez novas competências para ensinar. Porto Alegre: Artmed, 2000."
      ]
    },
    cursos: ["Pedagogia", "Licenciatura em Matemática", "Licenciatura em Letras", "Pós-Graduação em Docência"],
    obs: "",
    updatedAt: "2024-02-20T14:00:00Z"
  },
  {
    id: "disc-004",
    codigo: "DIR101",
    nome: "Introdução ao Direito",
    area: "Ciências Jurídicas",
    cargaHoraria: "60h",
    periodo: "1º Semestre",
    professor: "Prof. Dr. Roberto Lima",
    status: "ativo",
    ementa: "Estudo das noções fundamentais do Direito, incluindo fontes, normas jurídicas, interpretação, relação jurídica e os ramos do ordenamento jurídico brasileiro.",
    objetivos: "Introduzir o aluno aos conceitos basilares da Ciência Jurídica, fornecendo base teórica para o estudo das disciplinas jurídicas específicas.",
    conteudo: [
      "Conceito, objeto e método da Ciência Jurídica",
      "Fontes do Direito: lei, costume, jurisprudência e doutrina",
      "Norma jurídica: estrutura e características",
      "Interpretação e integração do Direito",
      "Relação jurídica: sujeitos, objeto e fato jurídico",
      "Ramos do Direito Público e Privado",
      "Hierarquia das normas e ordenamento jurídico",
      "Introdução à Teoria do Estado"
    ],
    bibliografia: {
      basica: [
        "REALE, Miguel. Lições preliminares de direito. 27. ed. São Paulo: Saraiva, 2019.",
        "DINIZ, Maria Helena. Compêndio de introdução à ciência do direito. 24. ed. São Paulo: Saraiva, 2015.",
        "MONTORO, André Franco. Introdução à ciência do direito. 32. ed. São Paulo: Revista dos Tribunais, 2019."
      ],
      complementar: [
        "KELSEN, Hans. Teoria pura do direito. 8. ed. São Paulo: Martins Fontes, 2009.",
        "NADER, Paulo. Introdução ao estudo do direito. 41. ed. Rio de Janeiro: Forense, 2019."
      ]
    },
    cursos: ["Direito"],
    obs: "",
    updatedAt: "2024-01-10T09:00:00Z"
  },
  {
    id: "disc-005",
    codigo: "ADM202",
    nome: "Gestão de Projetos",
    area: "Administração",
    cargaHoraria: "40h",
    periodo: "4º Semestre",
    professor: "Profa. Dra. Fernanda Costa",
    status: "ativo",
    ementa: "Fundamentos e técnicas de gerenciamento de projetos, ciclo de vida, escopo, tempo, custo, qualidade, riscos e comunicação, com base no PMBOK e metodologias ágeis.",
    objetivos: "Capacitar os alunos a planejar, executar, monitorar e encerrar projetos organizacionais utilizando as melhores práticas do mercado, tanto em abordagens tradicionais quanto ágeis.",
    conteudo: [
      "Conceitos e fundamentos de projetos e gerenciamento",
      "Ciclo de vida e grupos de processos do PMBOK",
      "Gerenciamento de escopo: EAP e declaração de escopo",
      "Gerenciamento de cronograma: Gantt e Caminho Crítico",
      "Gerenciamento de custos e orçamento",
      "Gerenciamento de riscos: identificação e resposta",
      "Comunicação e partes interessadas (stakeholders)",
      "Metodologias ágeis: Scrum, Kanban e SAFe",
      "Encerramento de projetos e lições aprendidas"
    ],
    bibliografia: {
      basica: [
        "PROJECT MANAGEMENT INSTITUTE. Guia PMBOK. 7. ed. Newtown Square: PMI, 2021.",
        "VARGAS, Ricardo. Gerenciamento de projetos. 9. ed. Rio de Janeiro: Brasport, 2018.",
        "KERZNER, Harold. Gestão de projetos: as melhores práticas. 3. ed. Porto Alegre: Bookman, 2017."
      ],
      complementar: [
        "SCHWABER, Ken; SUTHERLAND, Jeff. O guia definitivo do Scrum. Scrum.org, 2020.",
        "WYSOCKI, Robert K. Effective project management. 7. ed. Indianapolis: Wiley, 2014."
      ]
    },
    cursos: ["Administração", "Engenharia de Produção", "Sistemas de Informação", "MBA em Gestão Empresarial"],
    obs: "Disciplina com forte componente prático: os alunos desenvolvem um projeto real ao longo do semestre.",
    updatedAt: "2024-05-08T11:00:00Z"
  },
  {
    id: "disc-006",
    codigo: "BIO150",
    nome: "Biologia Celular e Molecular",
    area: "Ciências Biológicas",
    cargaHoraria: "60h",
    periodo: "1º Semestre",
    professor: "Prof. Dr. João Almeida",
    status: "revisao",
    ementa: "Estudo da estrutura e função das células, mecanismos moleculares da hereditariedade, expressão gênica, ciclo celular e biotecnologia aplicada.",
    objetivos: "Compreender os processos fundamentais da vida em nível celular e molecular, integrando conhecimentos de bioquímica, genética e fisiologia celular.",
    conteudo: [
      "Organização e ultraestrutura da célula procariótica e eucariótica",
      "Membrana plasmática: estrutura e transporte",
      "Organelas citoplasmáticas: função e biogênese",
      "DNA, RNA e síntese proteica",
      "Replicação do DNA e ciclo celular",
      "Mitose e meiose",
      "Regulação gênica em eucariotos",
      "Introdução à biotecnologia: PCR, clonagem e CRISPR"
    ],
    bibliografia: {
      basica: [
        "ALBERTS, Bruce et al. Biologia molecular da célula. 6. ed. Porto Alegre: Artmed, 2017.",
        "LODISH, Harvey et al. Biologia celular e molecular. 7. ed. Porto Alegre: Artmed, 2014.",
        "COOPER, Geoffrey M.; HAUSMAN, Robert E. A célula: uma abordagem molecular. 3. ed. Porto Alegre: Artmed, 2007."
      ],
      complementar: [
        "LEWIN, Benjamin. Genes XII. 12. ed. Burlington: Jones & Bartlett Learning, 2018.",
        "DE ROBERTIS, Eduardo M. F.; HIB, José. Bases da biologia celular e molecular. 4. ed. Rio de Janeiro: Guanabara Koogan, 2006."
      ]
    },
    cursos: ["Biologia", "Biomedicina", "Enfermagem", "Farmácia", "Medicina"],
    obs: "Ementa em processo de revisão para inclusão de tópicos de epigenética.",
    updatedAt: "2024-06-01T16:30:00Z"
  }
];
