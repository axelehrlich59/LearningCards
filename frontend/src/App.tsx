import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import "./App.css";

const API_URL = "http://localhost:3000";

const levelLabels = {
  SEEN: "Vu",
  UNDERSTOOD: "Compris",
  USED: "Utilise",
  EXPLAINED: "Explique",
} as const;

const interactionLabels = {
  FLASHCARD: "Flashcard",
  QUIZ: "Quiz",
  PROMPT: "Prompt",
} as const;

type ConceptLevel = keyof typeof levelLabels;
type InteractionType = keyof typeof interactionLabels;

type Example = {
  id: string;
  title: string | null;
  content: string;
};

type Interaction = {
  id: string;
  type: InteractionType;
  prompt: string;
  answer: string | null;
};

type Concept = {
  id: string;
  title: string;
  personalExplanation: string;
  problemSolved: string;
  level: ConceptLevel;
  nextReviewAt: string | null;
  examples: Example[];
  interactions: Interaction[];
};

type ConceptForm = {
  title: string;
  personalExplanation: string;
  problemSolved: string;
  example: string;
  interactionType: InteractionType;
  interactionPrompt: string;
  interactionAnswer: string;
};

const initialForm: ConceptForm = {
  title: "",
  personalExplanation: "",
  problemSolved: "",
  example: "",
  interactionType: "FLASHCARD",
  interactionPrompt: "",
  interactionAnswer: "",
};

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    throw new Error("La requete a echoue");
  }

  return response.json() as Promise<T>;
}

function formatReviewDate(value: string | null) {
  if (!value) return "A planifier";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function App() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [form, setForm] = useState<ConceptForm>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedConcept = useMemo(() => {
    return concepts.find((concept) => concept.id === selectedConceptId) ?? concepts[0];
  }, [concepts, selectedConceptId]);

  const dueConcepts = useMemo(() => {
    const now = new Date();
    return concepts.filter((concept) => {
      return !concept.nextReviewAt || new Date(concept.nextReviewAt) <= now;
    });
  }, [concepts]);

  useEffect(() => {
    let isMounted = true;

    fetchJson<Concept[]>("/concepts")
      .then((data) => {
        if (!isMounted) return;
        setError(null);
        setConcepts(data);
        setSelectedConceptId((currentId) => currentId ?? data[0]?.id ?? null);
      })
      .catch(() => {
        if (!isMounted) return;
        setError("API indisponible. Lance npm run dev:api pour charger les concepts.");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function updateForm(field: keyof ConceptForm, value: string) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  async function createConcept(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    const examples = form.example.trim()
      ? [{ content: form.example.trim() }]
      : undefined;
    const interactions = form.interactionPrompt.trim()
      ? [
          {
            type: form.interactionType,
            prompt: form.interactionPrompt.trim(),
            answer: form.interactionAnswer.trim() || undefined,
          },
        ]
      : undefined;

    try {
      const concept = await fetchJson<Concept>("/concepts", {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          personalExplanation: form.personalExplanation.trim(),
          problemSolved: form.problemSolved.trim(),
          examples,
          interactions,
        }),
      });

      setConcepts((currentConcepts) => [concept, ...currentConcepts]);
      setSelectedConceptId(concept.id);
      setForm(initialForm);
    } catch {
      setError("Impossible de creer le concept. Verifie les champs obligatoires.");
    } finally {
      setIsSaving(false);
    }
  }

  async function reviewConcept(level: ConceptLevel) {
    if (!selectedConcept) return;

    try {
      const updatedConcept = await fetchJson<Concept>(
        `/concepts/${selectedConcept.id}/review`,
        {
          method: "POST",
          body: JSON.stringify({ level }),
        },
      );

      setConcepts((currentConcepts) =>
        currentConcepts.map((concept) =>
          concept.id === updatedConcept.id ? updatedConcept : concept,
        ),
      );
    } catch {
      setError("Impossible de mettre a jour la revision.");
    }
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <aside className="sidebar" aria-label="Concepts">
          <div className="sidebar-header">
            <div>
              <p className="eyebrow">LearningCards</p>
              <h1>Concepts</h1>
            </div>
            <span className="due-count">{dueConcepts.length}</span>
          </div>

          {isLoading ? (
            <p className="muted">Chargement...</p>
          ) : concepts.length === 0 ? (
            <p className="muted">Aucun concept pour le moment.</p>
          ) : (
            <div className="concept-list">
              {concepts.map((concept) => (
                <button
                  className={
                    concept.id === selectedConcept?.id
                      ? "concept-item active"
                      : "concept-item"
                  }
                  key={concept.id}
                  onClick={() => setSelectedConceptId(concept.id)}
                  type="button"
                >
                  <span>{concept.title}</span>
                  <small>{levelLabels[concept.level]}</small>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="detail-panel">
          <div className="panel-top">
            <div>
              <p className="eyebrow">Fiche active</p>
              <h2>{selectedConcept?.title ?? "Cree ton premier concept"}</h2>
            </div>
            {selectedConcept ? (
              <span className="review-date">
                Revision {formatReviewDate(selectedConcept.nextReviewAt)}
              </span>
            ) : null}
          </div>

          {selectedConcept ? (
            <article className="concept-detail">
              <section>
                <h3>Explication personnelle</h3>
                <p>{selectedConcept.personalExplanation}</p>
              </section>
              <section>
                <h3>Probleme resolu</h3>
                <p>{selectedConcept.problemSolved}</p>
              </section>

              <div className="split">
                <section>
                  <h3>Exemples</h3>
                  {selectedConcept.examples.length > 0 ? (
                    selectedConcept.examples.map((example) => (
                      <p className="learning-block" key={example.id}>
                        {example.content}
                      </p>
                    ))
                  ) : (
                    <p className="muted">Aucun exemple ajoute.</p>
                  )}
                </section>

                <section>
                  <h3>Interactions</h3>
                  {selectedConcept.interactions.length > 0 ? (
                    selectedConcept.interactions.map((interaction) => (
                      <details className="learning-block" key={interaction.id}>
                        <summary>
                          {interactionLabels[interaction.type]}: {interaction.prompt}
                        </summary>
                        <p>{interaction.answer ?? "Auto-evaluation ouverte."}</p>
                      </details>
                    ))
                  ) : (
                    <p className="muted">Aucune interaction ajoutee.</p>
                  )}
                </section>
              </div>

              <section>
                <h3>Niveau</h3>
                <div className="level-actions">
                  {(Object.keys(levelLabels) as ConceptLevel[]).map((level) => (
                    <button
                      className={level === selectedConcept.level ? "active" : ""}
                      key={level}
                      onClick={() => void reviewConcept(level)}
                      type="button"
                    >
                      {levelLabels[level]}
                    </button>
                  ))}
                </div>
              </section>
            </article>
          ) : (
            <div className="empty-state">
              <p>
                Commence par une fiche courte. Si l'explication est floue, c'est
                justement le signal qu'il faut travailler le concept.
              </p>
            </div>
          )}
        </section>

        <section className="create-panel" aria-label="Nouveau concept">
          <p className="eyebrow">Nouvelle fiche</p>
          <h2>Clarifier</h2>

          <form onSubmit={createConcept}>
            <label>
              Titre
              <input
                onChange={(event) => updateForm("title", event.target.value)}
                required
                value={form.title}
              />
            </label>

            <label>
              Explication personnelle
              <textarea
                onChange={(event) =>
                  updateForm("personalExplanation", event.target.value)
                }
                required
                rows={5}
                value={form.personalExplanation}
              />
            </label>

            <label>
              Probleme resolu
              <textarea
                onChange={(event) =>
                  updateForm("problemSolved", event.target.value)
                }
                required
                rows={3}
                value={form.problemSolved}
              />
            </label>

            <label>
              Exemple concret
              <textarea
                onChange={(event) => updateForm("example", event.target.value)}
                rows={3}
                value={form.example}
              />
            </label>

            <div className="interaction-row">
              <label>
                Type
                <select
                  onChange={(event) =>
                    updateForm("interactionType", event.target.value)
                  }
                  value={form.interactionType}
                >
                  <option value="FLASHCARD">Flashcard</option>
                  <option value="QUIZ">Quiz</option>
                  <option value="PROMPT">Prompt</option>
                </select>
              </label>
              <label>
                Interaction
                <input
                  onChange={(event) =>
                    updateForm("interactionPrompt", event.target.value)
                  }
                  value={form.interactionPrompt}
                />
              </label>
            </div>

            <label>
              Reponse attendue
              <input
                onChange={(event) =>
                  updateForm("interactionAnswer", event.target.value)
                }
                value={form.interactionAnswer}
              />
            </label>

            {error ? <p className="form-error">{error}</p> : null}

            <button className="submit-button" disabled={isSaving} type="submit">
              {isSaving ? "Creation..." : "Creer le concept"}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}

export default App;
