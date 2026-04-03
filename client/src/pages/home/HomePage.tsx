import { useEffect, useState } from "react";
import { LibrarySection } from "../../components/documents/lists/DocumentList";
import { UploadPanel } from "../../components/documents/upload/UploadPanel";
import { NavBar } from "../../components/shared/NavBar";
import { useAuth } from "../../context/useAuth";
import { getLocalDocuments } from "../../lib/localApi/getLocalDocuments";
import { saveLocalDocument } from "../../lib/localApi/saveLocalDocument";
import type { StoredDocument } from "../../types/documents";

function HeroSection() {
  return (
    <section className="max-w-3xl">
      <div className="mb-3 [font-family:var(--font-ui)] text-xs font-semibold uppercase tracking-[0.18em] text-(--on-surface-muted)">
        Home
      </div>

      <h1 className="[font-family:var(--font-reading)] text-5xl leading-[1.02] font-medium tracking-[-0.03em] text-(--on-surface) md:text-6xl">
        Welcome to your <span className="italic text-(--primary)">Library</span>.
      </h1>

      <p className="mt-5 max-w-2xl [font-family:var(--font-ui)] text-xl leading-9 text-(--on-surface-muted)">
        Upload a text, read a book, and build your own vocabulary archive.
      </p>
    </section>
  );
}

export function HomePage() {
  const { isAuthenticated } = useAuth();

  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDocuments() {
      try {
        //TODO: add remote fetch
        if (!isAuthenticated) {
          const localDocs = await getLocalDocuments();

          setDocuments(
            localDocs.map((doc) => ({
              id: doc.id,
              title: doc.title,
              author: doc.author,
              cover: doc.cover,
              file_type: doc.file_type,
              created_at: doc.created_at,
              source: doc.source,
              progress: 0, //TODO
            }))
          );
          return;
        }
    
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : "Failed to load documents"
        );
      }
    }

    loadDocuments();
  }, [isAuthenticated]);

  const handleUpload = async (file: File) => {
    setUploadError(null);
    setIsUploading(true);

    try {
      //TODO: add remote save
      if (!isAuthenticated) {
         const saved = await saveLocalDocument(file);

        setDocuments((prev) => [
          {
            id: saved.id,
            title: saved.title,
            author: saved.author,
            cover: saved.cover,
            file_type: saved.file_type,
            created_at: saved.created_at,
            source: saved.source,
            progress: 0, //TODO
          },
          ...prev,
        ]);
      } 
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-(--surface) text-(--on-surface)">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-6 py-8 lg:px-8 lg:py-10">
          <HeroSection />

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
            <UploadPanel
              onUpload={handleUpload}
              isUploading={isUploading}
              error={uploadError}
            />
          </section>

          <LibrarySection docs={documents} />
        </div>
      </main>
    </>
  );
}