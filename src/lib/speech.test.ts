import { describe, it, expect } from 'vitest';
import { reconstructSpeechTranscript } from './speech';

describe('reconstructSpeechTranscript', () => {
  it('handles a single final chunk with no pre-existing text', () => {
    const results = [{ 0: { transcript: 'Result is never negative.' } }];
    const output = reconstructSpeechTranscript('', results);
    expect(output).toBe('Result is never negative.');
  });

  it('reconstructs multiple consecutive chunks without repeating previous chunks', () => {
    const results = [
      { 0: { transcript: 'The discount ' } },
      { 0: { transcript: 'must never be negative. ' } },
      { 0: { transcript: 'A 100% discount gives zero.' } },
    ];
    const output = reconstructSpeechTranscript('', results);
    expect(output).toBe('The discount must never be negative. A 100% discount gives zero.');
  });

  it('preserves pre-existing base requirements text', () => {
    const baseText = 'Initial user requirement.';
    const results = [
      { 0: { transcript: 'A 0% discount preserves the price.' } },
    ];
    const output = reconstructSpeechTranscript(baseText, results);
    expect(output).toBe('Initial user requirement. A 0% discount preserves the price.');
  });

  it('correctly updates as interim chunks are replaced or extended in place', () => {
    // Event 1: first phrase
    const event1 = [{ 0: { transcript: 'Price cannot' } }];
    expect(reconstructSpeechTranscript('', event1)).toBe('Price cannot');

    // Event 2: first phrase completed, second chunk starting
    const event2 = [
      { 0: { transcript: 'Price cannot be negative. ' } },
      { 0: { transcript: 'Full discount' } },
    ];
    expect(reconstructSpeechTranscript('', event2)).toBe('Price cannot be negative. Full discount');

    // Event 3: second chunk completed
    const event3 = [
      { 0: { transcript: 'Price cannot be negative. ' } },
      { 0: { transcript: 'Full discount makes it free.' } },
    ];
    expect(reconstructSpeechTranscript('', event3)).toBe('Price cannot be negative. Full discount makes it free.');
  });

  it('respects the 2000 character maximum limit', () => {
    const longChunk = 'a'.repeat(2500);
    const results = [{ 0: { transcript: longChunk } }];
    const output = reconstructSpeechTranscript('', results);
    expect(output.length).toBe(2000);
  });
});
