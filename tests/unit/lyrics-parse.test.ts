import { describe, expect, it } from "vitest";
import {
  isChordLine,
  matchSong,
  normalizeKey,
  parseLyricsDocument,
  titleFromFilename,
} from "@/lib/lyrics/parse";

describe("normalizeKey", () => {
  it("entiende notación española y americana", () => {
    expect(normalizeKey("Mi menor")).toBe("Em");
    expect(normalizeKey("Lam")).toBe("Am");
    expect(normalizeKey("Fa#")).toBe("F#");
    expect(normalizeKey("Si bemol mayor")).toBe("Bb");
    expect(normalizeKey("sol")).toBe("G");
    expect(normalizeKey("E minor")).toBe("Em");
    expect(normalizeKey("C#m")).toBe("C#m");
    expect(normalizeKey("Bb")).toBe("Bb");
  });

  it("rechaza lo que no es una tonalidad", () => {
    expect(normalizeKey("rápido")).toBeNull();
    expect(normalizeKey("")).toBeNull();
  });
});

describe("isChordLine", () => {
  it("reconoce líneas de acordes", () => {
    expect(isChordLine("Am      G       F")).toBe(true);
    expect(isChordLine("| Do | Sol | Lam | Fa |")).toBe(true);
    expect(isChordLine("Em7  Cmaj7  D/F#  (x2)")).toBe(true);
    expect(isChordLine("Am7")).toBe(true);
  });

  it("no confunde letra con acordes", () => {
    expect(isChordLine("Si la ves por la calle")).toBe(false);
    expect(isChordLine("A veces pienso en volver")).toBe(false);
    expect(isChordLine("La")).toBe(false);
    expect(isChordLine("Mi")).toBe(false);
  });
});

describe("titleFromFilename", () => {
  it("limpia numeración, extensión y versiones", () => {
    expect(titleFromFilename("03 - Sin frenos (v2).docx")).toBe("Sin frenos");
    expect(titleFromFilename("letras/Carta_al_ayer.pdf")).toBe("Carta al ayer");
    expect(titleFromFilename("22 de abril.docx")).toBe("22 de abril");
  });
});

// Letra inventada para las pruebas
const DOC = `Farolas de cartón (Tono: Mi menor)
Tempo: 128 BPM

[Estrofa 1]
Em          C
Cruzo la avenida con prisa
G              D
buscando un bar que no cierra

ESTRIBILLO:
Am        C
Farolas de cartón
Em          D
alumbran mi canción
`;

describe("parseLyricsDocument", () => {
  it("separa título, tonalidad, tempo, secciones, acordes y letra", () => {
    const [song] = parseLyricsDocument(DOC, "farolas.docx");
    expect(song.title).toBe("Farolas de cartón");
    expect(song.keyRaw).toBe("Mi menor");
    expect(song.keySignature).toBe("Em");
    expect(song.tempo).toBe(128);
    expect(song.lyrics).toBe(
      [
        "[Estrofa 1]",
        "Cruzo la avenida con prisa",
        "buscando un bar que no cierra",
        "",
        "[Estribillo]",
        "Farolas de cartón",
        "alumbran mi canción",
      ].join("\n"),
    );
    expect(song.chords).toContain("Em          C");
    expect(song.chords).toContain("Cruzo la avenida con prisa");
    expect(song.lineCount).toBe(4);
  });

  it("usa el nombre del archivo si la primera línea ya es letra", () => {
    const [song] = parseLyricsDocument("Tonalidad: La\n\nCruzo la avenida\ncon prisa", "02 Avenida.txt");
    expect(song.title).toBe("Avenida");
    expect(song.keySignature).toBe("A");
    expect(song.lyrics).toBe("Cruzo la avenida\ncon prisa");
    expect(song.chords).toBeNull();
  });

  it("quita acordes en línea tipo ChordPro", () => {
    const [song] = parseLyricsDocument("[Am]Cruzo la [G]avenida", "x.txt");
    expect(song.lyrics).toBe("Cruzo la avenida");
    expect(song.chords).toBe("[Am]Cruzo la [G]avenida");
  });

  it("divide un documento con varias canciones conocidas", () => {
    const text = "LETRAS DEL GRUPO\n\nPrimera\nTono: Re\nuno dos tres\n\nSEGUNDA (key: Bb)\ncuatro cinco\n";
    const songs = parseLyricsDocument(text, "letras.docx", ["Primera", "Segunda", "Otra"]);
    expect(songs.map((s) => [s.title, s.keySignature, s.lyrics])).toEqual([
      ["Primera", "D", "uno dos tres"],
      ["SEGUNDA", "Bb", "cuatro cinco"],
    ]);
  });
});

describe("matchSong", () => {
  const songs = [
    { id: "1", title: "Sin Frenos" },
    { id: "2", title: "Carta al Ayer" },
    { id: "3", title: "Luces" },
    { id: "4", title: "Luces de Neón" },
  ];

  it("ignora mayúsculas, tildes y signos", () => {
    expect(matchSong("sin frenos!", songs)?.id).toBe("1");
    expect(matchSong("Luces de neon", songs)?.id).toBe("4");
  });

  it("acepta coincidencia parcial solo si no es ambigua", () => {
    expect(matchSong("Carta al ayer (acústica)", songs)?.id).toBe("2");
    expect(matchSong("Luces de", songs)).toBeNull();
    expect(matchSong("Otra cosa", songs)).toBeNull();
  });
});
