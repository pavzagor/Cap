export function escapeVttText(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

export function decodeVttText(text: string): string {
	return text.replace(/&(amp|lt|gt|nbsp|lrm|rlm);/g, (entity) => {
		switch (entity) {
			case "&amp;":
				return "&";
			case "&lt;":
				return "<";
			case "&gt;":
				return ">";
			case "&nbsp;":
				return "\u00a0";
			case "&lrm;":
				return "\u200e";
			case "&rlm;":
				return "\u200f";
			default:
				return entity;
		}
	});
}

export function parseVttCueText(payload: string): {
	text: string;
	speaker: string | null;
} {
	const voice = payload.match(/^\s*<v(?:\.[^\s>]*)?\s+([^>]+)>/);
	const annotation = voice?.[1]?.trim();
	return {
		text: decodeVttText(
			payload.replace(
				/<(?:\/(?:c|i|b|u|ruby|rt|v|lang)|(?:c|i|b|u|ruby|rt|v|lang)(?:\.[^\s<>]+)*(?:[ \t]+[^<>]*)?|(?:\d{2,}:)?\d{2}:\d{2}\.\d{3})>/g,
				"",
			),
		).trim(),
		speaker: annotation
			? decodeVttText(annotation).replace(/^Speaker /, "")
			: null,
	};
}

export function formatVttCueText(
	text: string,
	speaker?: string | null,
): string {
	const escapedText = escapeVttText(normalizeTranscriptCueText(text));
	return speaker
		? `<v Speaker ${escapeVttText(normalizeTranscriptCueText(speaker))}>${escapedText}</v>`
		: escapedText;
}

export function normalizeTranscriptCueText(text: string): string {
	return text.replace(/\s+/g, " ").trim();
}

export function updateVttEntryText(
	vttContent: string,
	entryId: number,
	newText: string,
): { content: string; updated: boolean } {
	const normalizedText = normalizeTranscriptCueText(newText);
	const lines = vttContent.split(/\r?\n/);
	const updatedLines: string[] = [];
	let index = 0;
	let updated = false;

	while (index < lines.length) {
		const line = lines[index] ?? "";
		const trimmedLine = line.trim();

		if (!/^\d+$/.test(trimmedLine)) {
			updatedLines.push(line);
			index++;
			continue;
		}

		const cueId = parseInt(trimmedLine, 10);
		const cueStart = index;
		let cueEnd = cueStart + 1;

		while (cueEnd < lines.length && (lines[cueEnd] ?? "").trim() !== "") {
			cueEnd++;
		}

		if (cueId !== entryId) {
			updatedLines.push(...lines.slice(cueStart, cueEnd));
			if (cueEnd < lines.length) {
				updatedLines.push(lines[cueEnd] ?? "");
			}
			index = cueEnd + 1;
			continue;
		}

		const cueLines = lines.slice(cueStart, cueEnd);
		const timingIndex = cueLines.findIndex((cueLine) =>
			cueLine.includes("-->"),
		);

		if (timingIndex === -1) {
			updatedLines.push(...cueLines);
			if (cueEnd < lines.length) {
				updatedLines.push(lines[cueEnd] ?? "");
			}
			index = cueEnd + 1;
			continue;
		}

		const { speaker } = parseVttCueText(
			cueLines.slice(timingIndex + 1).join(" "),
		);
		updatedLines.push(
			...cueLines.slice(0, timingIndex + 1),
			formatVttCueText(normalizedText, speaker),
		);
		if (cueEnd < lines.length) {
			updatedLines.push(lines[cueEnd] ?? "");
		}
		updated = true;
		index = cueEnd + 1;
	}

	return {
		content: updatedLines.join("\n"),
		updated,
	};
}

export interface TranscriptEntry {
	id: number;
	timestamp: string;
	text: string;
	startTime: number;
	endTime: number;
	speaker?: string | null;
}
