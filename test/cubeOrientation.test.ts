import { expect } from "chai";
import { effectiveCubeYaw, permuteCubeFaces } from "../src/renderers/isometric/cubeOrientation";
import { IsoCubeFaces } from "../src/schemas/schema";

const faces: IsoCubeFaces = {
    top: "top",
    north: "north",
    east: "east",
    south: "south",
    west: "west",
};

describe("permuteCubeFaces", () => {
    it("should map yaw 0 to west left and east right", () => {
        expect(permuteCubeFaces(faces, 0)).to.deep.equal({
            top: "top",
            left: "west",
            right: "east",
        });
    });

    it("should map yaw 1 to north left and south right", () => {
        expect(permuteCubeFaces(faces, 1)).to.deep.equal({
            top: "top",
            left: "north",
            right: "south",
        });
    });

    it("should map yaw 2 to east left and west right", () => {
        expect(permuteCubeFaces(faces, 2)).to.deep.equal({
            top: "top",
            left: "east",
            right: "west",
        });
    });

    it("should map yaw 3 to south left and north right", () => {
        expect(permuteCubeFaces(faces, 3)).to.deep.equal({
            top: "top",
            left: "south",
            right: "north",
        });
    });

    it("should wrap negative and large yaw values", () => {
        expect(permuteCubeFaces(faces, -1)).to.deep.equal(permuteCubeFaces(faces, 3));
        expect(permuteCubeFaces(faces, 5)).to.deep.equal(permuteCubeFaces(faces, 1));
    });
});

describe("effectiveCubeYaw", () => {
    it("should combine piece yaw with board quarter turns", () => {
        expect(effectiveCubeYaw(1, 0)).to.equal(1);
        expect(effectiveCubeYaw(1, 90)).to.equal(2);
        expect(effectiveCubeYaw(3, 90)).to.equal(0);
        expect(effectiveCubeYaw(0, 270)).to.equal(3);
    });

    it("should normalize negative board rotation", () => {
        expect(effectiveCubeYaw(0, -90)).to.equal(3);
    });
});
