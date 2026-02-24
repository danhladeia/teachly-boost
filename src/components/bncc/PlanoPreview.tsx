import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlanoPreviewProps {
  plano: any;
  modelo: string;
}

export default function PlanoPreview({ plano, modelo }: PlanoPreviewProps) {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          Plano de Aula Gerado
          <span className="text-xs font-normal bg-primary/10 text-primary px-2 py-1 rounded-full">
            {modelo === "simples" ? "⚡ Simples" : modelo === "criativo" ? "🚀 Criativo (PBL)" : "📋 Tradicional"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Identificação */}
        {plano.identificacao && (
          <Section icon="📋" title="Identificação" bg>
            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              <p><strong>Disciplina:</strong> {plano.identificacao.disciplina}</p>
              <p><strong>Nível:</strong> {plano.identificacao.nivel}</p>
              <p><strong>Duração:</strong> {plano.identificacao.duracao}</p>
              <p><strong>Tema:</strong> {plano.identificacao.tema}</p>
            </div>
          </Section>
        )}

        {/* Habilidades BNCC */}
        {plano.habilidades_bncc?.length > 0 && (
          <Section icon="📚" title="Habilidades BNCC">
            <div className="space-y-2">
              {plano.habilidades_bncc.map((h: any, i: number) => (
                <div key={i} className="rounded-lg border p-3 text-sm">
                  <span className="font-mono text-xs text-primary font-semibold">{h.codigo}</span>
                  <p className="text-muted-foreground mt-1">{h.descricao}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Pergunta Norteadora (Criativo) */}
        {plano.pergunta_norteadora && (
          <Section icon="❓" title="Pergunta Norteadora (PBL)">
            <p className="text-sm font-medium bg-accent/50 rounded-lg p-4 border-l-4 border-primary">{plano.pergunta_norteadora}</p>
          </Section>
        )}

        {/* Objetivos */}
        {plano.objetivos?.length > 0 && (
          <Section icon="🎯" title="Objetivos de Aprendizagem">
            <ul className="space-y-1 text-sm list-disc list-inside text-muted-foreground">
              {plano.objetivos.map((o: string, i: number) => <li key={i}>{o}</li>)}
            </ul>
          </Section>
        )}

        {/* Conteúdo Programático (Tradicional) */}
        {plano.conteudo_programatico && (
          <Section icon="📖" title="Conteúdo Programático">
            <p className="text-sm text-muted-foreground whitespace-pre-line">{plano.conteudo_programatico}</p>
          </Section>
        )}

        {/* Gancho Inicial (Tradicional) */}
        {plano.gancho_inicial && (
          <Section icon="🪝" title="Gancho Inicial (Hook)">
            <p className="text-sm text-muted-foreground bg-accent/50 rounded-lg p-3">{plano.gancho_inicial}</p>
          </Section>
        )}

        {/* Problema/Desafio (Criativo) */}
        {plano.problema_desafio && (
          <Section icon="🧩" title="O Problema / Desafio">
            <p className="text-sm text-muted-foreground whitespace-pre-line">{plano.problema_desafio}</p>
          </Section>
        )}

        {/* Pesquisa/Exploração (Criativo) */}
        {plano.pesquisa_exploracao && (
          <Section icon="🔍" title="Pesquisa e Exploração">
            <p className="text-sm text-muted-foreground whitespace-pre-line">{plano.pesquisa_exploracao}</p>
          </Section>
        )}

        {/* Criação/Prototipagem (Criativo) */}
        {plano.criacao_prototipagem && (
          <Section icon="🛠️" title="Criação e Prototipagem">
            <p className="text-sm text-muted-foreground whitespace-pre-line">{plano.criacao_prototipagem}</p>
          </Section>
        )}

        {/* Roteiro Sala Invertida (Criativo) */}
        {plano.roteiro_sala_invertida && (
          <Section icon="🔄" title="Roteiro de Sala Invertida">
            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="font-semibold text-primary mb-1">📥 Atividade Prévia (antes da aula)</p>
                <p className="text-muted-foreground">{plano.roteiro_sala_invertida.atividade_previa}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="font-semibold text-primary mb-1">🏫 Atividade em Sala</p>
                <p className="text-muted-foreground">{plano.roteiro_sala_invertida.atividade_em_sala}</p>
              </div>
            </div>
          </Section>
        )}

        {/* Gamificação (Criativo) */}
        {plano.gamificacao && (
          <Section icon="🎮" title="Gamificação">
            <p className="text-sm text-muted-foreground whitespace-pre-line">{plano.gamificacao}</p>
          </Section>
        )}

        {/* Cronograma (Tradicional) */}
        {plano.cronograma && !plano.cronograma_aulas && (
          <Section icon="⏱️" title="Cronograma">
            <div className="space-y-2 text-sm">
              {plano.cronograma.introducao && <p><strong>Introdução:</strong> {plano.cronograma.introducao}</p>}
              {plano.cronograma.desenvolvimento && <p><strong>Desenvolvimento:</strong> {plano.cronograma.desenvolvimento}</p>}
              {plano.cronograma.fechamento && <p><strong>Fechamento:</strong> {plano.cronograma.fechamento}</p>}
            </div>
          </Section>
        )}

        {/* Cronograma Aula a Aula (multi-aula) */}
        {plano.cronograma_aulas?.length > 0 && (
          <Section icon="📅" title={`Cronograma - ${plano.cronograma_aulas.length} Aulas`}>
            <div className="space-y-3">
              {plano.cronograma_aulas.map((aula: any, i: number) => (
                <div key={i} className="rounded-lg border p-4 text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">Aula {aula.aula || i + 1}</span>
                    <span className="font-semibold">{aula.titulo}</span>
                    {aula.duracao && <span className="text-xs text-muted-foreground ml-auto">{aula.duracao}</span>}
                  </div>
                  {aula.objetivos && (
                    <ul className="list-disc list-inside text-muted-foreground mb-1">
                      {(Array.isArray(aula.objetivos) ? aula.objetivos : [aula.objetivos]).map((o: string, j: number) => <li key={j}>{o}</li>)}
                    </ul>
                  )}
                  {aula.atividades && <p className="text-muted-foreground">{aula.atividades}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Resumo Atividade (Simples) */}
        {plano.resumo_atividade && (
          <Section icon="📝" title="Resumo da Atividade">
            <p className="text-sm text-muted-foreground whitespace-pre-line">{plano.resumo_atividade}</p>
          </Section>
        )}

        {/* Desenvolvimento (Tradicional) */}
        {plano.desenvolvimento && (
          <Section icon="📖" title="Desenvolvimento">
            <div className="text-sm text-muted-foreground whitespace-pre-line bg-secondary/50 rounded-lg p-4">{plano.desenvolvimento}</div>
          </Section>
        )}

        {/* Recursos */}
        {plano.recursos?.length > 0 && (
          <Section icon="🧰" title="Recursos Necessários">
            <ul className="space-y-1 text-sm list-disc list-inside text-muted-foreground">
              {plano.recursos.map((r: string, i: number) => <li key={i}>{r}</li>)}
            </ul>
          </Section>
        )}

        {/* Diferenciação */}
        {plano.diferenciacao && (
          <Section icon="♿" title="Diferenciação e Inclusão">
            <p className="text-sm text-muted-foreground whitespace-pre-line">{plano.diferenciacao}</p>
          </Section>
        )}

        {/* Avaliação (OBRIGATÓRIO) */}
        {plano.avaliacao && (
          <Section icon="✅" title="Avaliação">
            <p className="text-sm text-muted-foreground whitespace-pre-line">{plano.avaliacao}</p>
          </Section>
        )}

        {/* Referências (OBRIGATÓRIO) */}
        {plano.referencias?.length > 0 && (
          <Section icon="📚" title="Referências (ABNT)">
            <ul className="space-y-2 text-sm text-muted-foreground">
              {plano.referencias.map((r: string, i: number) => (
                <li key={i} className="pl-4 border-l-2 border-muted">{r}</li>
              ))}
            </ul>
          </Section>
        )}
      </CardContent>
    </Card>
  );
}

function Section({ icon, title, children, bg }: { icon: string; title: string; children: React.ReactNode; bg?: boolean }) {
  return (
    <div className={bg ? "rounded-lg bg-primary/5 border border-primary/20 p-4" : ""}>
      <h4 className="font-display font-bold text-sm text-primary mb-2">{icon} {title}</h4>
      {children}
    </div>
  );
}
