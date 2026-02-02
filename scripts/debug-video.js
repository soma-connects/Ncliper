const YTDlpWrap = require('youtube-dl-exec');

async function test() {
    const url = "https://youtu.be/-tnNEamXLuY";
    console.log("Testing URL:", url);

    try {
        console.log("Trying with getTitle: true (smaller output)...");
        // Use getTitle instead of dumpSingleJson to reduce output size and potential buffer issues
        const titleOutput = await YTDlpWrap(url, {
            getTitle: true,
            noWarnings: true,
            preferFreeFormats: true,
        });
        console.log("Success with getTitle! Title:", titleOutput);

        console.log("Trying with dumpSingleJson: true (original method)...");
        const jsonOutput = await YTDlpWrap(url, {
            dumpSingleJson: true,
            noWarnings: true,
            preferFreeFormats: true,
        });
        console.log("Success with dumpSingleJson! Title:", jsonOutput.title);

    } catch (error) {
        console.error("Caught Error:");
        console.error(error.message);
        if (error.stderr) console.error("STDERR:", error.stderr);
    }
}

test();
