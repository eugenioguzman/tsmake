# tsmake
A work in progress idea of an API used to write workflows that depend on files.

Example:
```ts
// Create a new workflow that takes a single argument: a directory containing CRAM files
let wf = new WorkflowInput({cramdir: "dir"}).recognize("cramdir", "*/*.cram", (x) => {
    // from now on, we refer to each of the cram files simply as "cram"
    // and each corresponds to a different "sample"
    return ["cram", {
        "sample": x,
    }];
});


// To call variants chromosome-wise, create a second axis in our workflow
// called "chrom", additional to the already existing "sample" axis
let chromwise = wf.product({chrom: ["1", "2", "3"]})

// Specify the output files/directories with .output() and then use currying
// to define the command that generates them
let snps = chromwise.output({vcf: "file"})(
    x => `variant_caller --input ${x.cram} --region ${x.chrom} --output ${x.vcf}`
);

// Concatenate all chromosomes together with bcftools by grouping along
// the "chrom" axis and .join()'ing vcf names with a space between them
let grouped = snps.groupby("chrom").output({"mergedVcf": "file"})(
    x => `bcftools concat ${x.vcf.join()} > ${x.mergedVcf}`
);

// Make sure you tell the the workflow manager that you care about the file by doing .keep(outputFile)
grouped.keep("mergedVcf");
```
