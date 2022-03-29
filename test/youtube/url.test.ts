import { Assert } from "../../src/misc/assert";
import { parseYouTubeVideoId } from "../../src/youtube/url";

test("Should handle regular URLs", () => {
  const url = "https://www.youtube.com/watch?v=7JFtfM9rVvQ&list=LL&index=52";
  const result = parseYouTubeVideoId(url);
  Assert.checkCondition(result.isOk());
  const videoId = result.value;
  expect(videoId.raw).toEqual("7JFtfM9rVvQ");
});

test("Should handle shortened URLs", () => {
  const url = "https://youtu.be/7JFtfM9rVvQ";
  const result = parseYouTubeVideoId(url);
  Assert.checkCondition(result.isOk());
  const videoId = result.value;
  expect(videoId.raw).toEqual("7JFtfM9rVvQ");
});

test("Should handle YouTube music URLs", () => {
  const url = "https://music.youtube.com/watch?v=-6hxH80TCp8&list=RDAMVM-6hxH80TCp8";
  const result = parseYouTubeVideoId(url);
  Assert.checkCondition(result.isOk());
  const videoId = result.value;
  expect(videoId.raw).toEqual("-6hxH80TCp8");
});

test("Unknown URLs should return error", () => {
  const result = parseYouTubeVideoId("https://youtuu.be/7JFtfM9rVvQ");
  expect(result.isErr()).toBe(true);
  Assert.checkCondition(result.isErr());
});
