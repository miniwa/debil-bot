import { TrackLength } from "../../src/audio/track";

describe(TrackLength, () => {
  test("Should save seconds", () => {
    const seconds = 11;
    const length = new TrackLength(seconds);
    expect(length.getSeconds()).toEqual(seconds);
  });

  test("Should print human readable format", () => {
    const onlySeconds = 58;
    const onlySecondsLength = new TrackLength(onlySeconds);
    expect(onlySecondsLength.getHumanReadable()).toEqual("00:58");

    const minuteEdge = 59;
    const minuteEdgeLength = new TrackLength(minuteEdge);
    expect(minuteEdgeLength.getHumanReadable()).toEqual("00:59");

    const oneMinute = 60;
    const oneMinuteLength = new TrackLength(oneMinute);
    expect(oneMinuteLength.getHumanReadable()).toEqual("01:00");

    const long = 38 * 60 + 37;
    const longLength = new TrackLength(long);
    expect(longLength.getHumanReadable()).toEqual("38:37");
  });
});
