import { NodeType } from '../types';

const BASE_STYLE = "Epic realistic photograph, cosmic beauty, cinematic lighting, ultra-detailed, vibrant swirling nebula background, NASA photograph style, centered, view from deep space.";

export const getNodeImagePrompt = (nodeType: NodeType): string => {
    switch (nodeType) {
        case 'player_consciousness':
            return `A hyper-realistic core of a nascent universal consciousness. A swirling vortex of pure psionic energy and liquid starlight, pure thought given form. A beautiful, impossibly intricate fractal of cyan and magenta light, casting long shadows. ${BASE_STYLE}`;
        case 'star':
            return `A vibrant, hyper-realistic newborn star, glowing with brilliant yellow and orange plasma flares. Enormous magnetic loops arc from its surface, expelling shimmering solar winds into the cosmos. ${BASE_STYLE}`;
        case 'rocky_planet':
            return `A barren, photorealistic exoplanet of terracotta and grey basalt, its surface ultra-detailed with massive impact craters and deep, shadowed canyons under the sharp light of a distant star. Wisps of thin carbon dioxide atmosphere are visible. ${BASE_STYLE}`;
        case 'life_seed':
            return `A primordial exoplanet, now teeming with microscopic life. Its vast oceans glow with a soft, ethereal green and blue bioluminescence, hinting at the complex chemistry within. View from orbit shows faint, beautiful green swirls in the deep blue water, with polar ice caps. ${BASE_STYLE}`;
        case 'sentient_colony':
            return `A planet completely transformed by a collective intelligence. Crystalline, geometric cities cover the surface, pulsing with a soft purple psychic energy that is visible from space. A visible network of light connects major hubs, glowing brightly against the dark side of the planet. ${BASE_STYLE}`;
        default:
            return `A mysterious and beautiful cosmic object, unknown to science. ${BASE_STYLE}`;
    }
}
