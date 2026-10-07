import {
	AI_GENERATION_LANGUAGE_CODES,
	AI_GENERATION_LANGUAGES,
	isAiGenerationLanguage,
	parseAiGenerationLanguage,
} from "@cap/web-domain";
import { beforeEach, describe, expect, it, vi } from "vitest";

const env = vi.hoisted(() => ({
	TRANSCRIPTION_MODEL: undefined as string | undefined,
}));

vi.mock("@cap/env", () => ({ serverEnv: () => env }));

import {
	getAssemblyAISpeechModels,
	getAssemblyAITranscriptionOptions,
} from "@/lib/assemblyai";

describe("AI generation language support", () => {
	beforeEach(() => {
		env.TRANSCRIPTION_MODEL = undefined;
	});

	it("exposes Romanian for AI generation", () => {
		expect(AI_GENERATION_LANGUAGES.ro).toBe("Romanian");
		expect(isAiGenerationLanguage("ro")).toBe(true);
		expect(parseAiGenerationLanguage("ro")).toBe("ro");
	});

	it("does not expose unsupported transcription languages", () => {
		expect(AI_GENERATION_LANGUAGES).not.toHaveProperty("pa");
		expect(isAiGenerationLanguage("pa")).toBe(false);
		expect(parseAiGenerationLanguage("pa")).toBe("auto");
	});

	it("uses Universal-3.5 Pro with Universal-2 fallback", () => {
		const options = getAssemblyAITranscriptionOptions("auto");

		expect(options).toMatchObject({
			speech_models: ["universal-3-5-pro", "universal-2"],
			language_detection: true,
		});
		expect(options.disfluencies).toBe(true);
		if (!("language_detection_options" in options)) {
			throw new Error("Expected automatic language detection options");
		}
		expect(options.language_detection_options.expected_languages).toEqual(
			AI_GENERATION_LANGUAGE_CODES,
		);
	});

	it("passes explicit languages to AssemblyAI", () => {
		expect(getAssemblyAITranscriptionOptions("ro")).toMatchObject({
			speech_models: ["universal-3-5-pro", "universal-2"],
			language_code: "ro",
			disfluencies: true,
		});
		expect(getAssemblyAITranscriptionOptions("zh")).toMatchObject({
			speech_models: ["universal-3-5-pro", "universal-2"],
			language_code: "zh",
		});
	});
});

describe("transcription model configuration", () => {
	beforeEach(() => {
		env.TRANSCRIPTION_MODEL = undefined;
	});

	it("defaults to Universal-3.5 Pro with Universal-2 fallback", () => {
		expect(getAssemblyAISpeechModels()).toEqual([
			"universal-3-5-pro",
			"universal-2",
		]);
	});

	it("uses a configured model", () => {
		env.TRANSCRIPTION_MODEL = "universal-2";

		expect(getAssemblyAITranscriptionOptions("en")).toMatchObject({
			speech_models: ["universal-2"],
		});
	});

	it("accepts a comma-separated fallback list", () => {
		env.TRANSCRIPTION_MODEL = " slam-1 , universal-2 ,";

		expect(getAssemblyAISpeechModels()).toEqual(["slam-1", "universal-2"]);
	});

	it("falls back to the defaults when the setting is blank", () => {
		env.TRANSCRIPTION_MODEL = " , ";

		expect(getAssemblyAISpeechModels()).toEqual([
			"universal-3-5-pro",
			"universal-2",
		]);
	});
});
