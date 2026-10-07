import { serverEnv } from "@cap/env";
import {
	AI_GENERATION_LANGUAGE_AUTO,
	type AiGenerationLanguage,
	type AiGenerationLanguageCode,
} from "@cap/web-domain";

export const DEFAULT_ASSEMBLYAI_SPEECH_MODELS = [
	"universal-3-5-pro",
	"universal-2",
] as const;

export function getAssemblyAISpeechModels(): [string, ...string[]] {
	const [primary, ...fallbacks] =
		serverEnv()
			.TRANSCRIPTION_MODEL?.split(",")
			.map((model) => model.trim())
			.filter(Boolean) ?? [];
	return primary
		? [primary, ...fallbacks]
		: [...DEFAULT_ASSEMBLYAI_SPEECH_MODELS];
}

export const ASSEMBLYAI_SUPPORTED_LANGUAGES = [
	"en",
	"es",
	"fr",
	"de",
	"pt",
	"it",
	"nl",
	"pl",
	"ro",
	"sk",
	"ru",
	"tr",
	"ja",
	"ko",
	"zh",
	"ar",
	"hi",
	"bn",
	"ta",
	"te",
	"mr",
	"gu",
	"ur",
	"fa",
	"he",
] as const satisfies readonly AiGenerationLanguageCode[];

export function getAssemblyAITranscriptionOptions(
	language: AiGenerationLanguage,
) {
	const baseOptions = {
		speech_models: getAssemblyAISpeechModels(),
		format_text: true,
		punctuate: true,
		// Verbatim words: the single transcription pass feeds both the word-level
		// edit transcript and the caption VTT (which strips fillers itself).
		disfluencies: true,
	};

	if (language === AI_GENERATION_LANGUAGE_AUTO) {
		return {
			...baseOptions,
			language_detection: true,
			language_detection_options: {
				expected_languages: [...ASSEMBLYAI_SUPPORTED_LANGUAGES],
			},
		};
	}

	return {
		...baseOptions,
		language_code: language,
	};
}
