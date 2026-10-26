/**
 * Reconstructs a full dictation session transcript from Web Speech API recognition results,
 * preserving pre-existing text and avoiding duplicate interim phrases or dropped chunks.
 */
export function reconstructSpeechTranscript(
  baseText: string,
  results: ArrayLike<{ [key: number]: { transcript: string } }>
): string {
  let sessionText = '';
  for (let i = 0; i < results.length; i++) {
    const item = results[i];
    if (item && item[0] && typeof item[0].transcript === 'string') {
      sessionText += item[0].transcript;
    }
  }
  const prefix = baseText ? baseText.trim() + ' ' : '';
  return (prefix + sessionText.trimStart()).slice(0, 2000);
}
