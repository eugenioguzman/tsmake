type OutputFileTypes = Record<string, "file" | "dir" | "pipe" | "temp" | "prefix">;

type KeyOf<T, U> = {
    [K in keyof T]: U;
};

function quote(unquoted: string) {
    return '"' + unquoted.replace(/"/g, '\\"').replace(/\$/g, '\\$') + '"';
}

class Filename {
    path: string;
    constructor(path: string) {
        this.path = path;
    }

    toString(): string {
        return this.path;
    }

    quote(): string {
        return quote(this.path);
    }
}

class Filenames {
    paths: string[];
    constructor(paths: string[]) {
        this.paths = paths;
    }

    join(sep?: string): string {
        return this.paths.join(sep ?? " ");
    }

    quoteJoin(sep?: string): string {
        return this.paths.map(quote).join(sep ?? " ");
    }

    toString(): string {
        throw new Error("Implicit conversions from Filenames object to string are not allowed. Use .join() instead.");
    }
}

type EffectiveFileType<
    Produced extends string,
    Active extends string
> = [Produced] extends [never] ? Filename : (
    [Active] extends [never] ? Filenames : (
        [Produced] extends [Produced & Active] ? Filename : Filenames
    )
);

type GetFile<Files extends Record<string, string>, Active extends string> = { [K in keyof Files]: EffectiveFileType<Files[K], Active> };

type MergeFileMaps<
  F extends Record<string, string>,
  G extends Record<string, string>
> = F & G;

class OutputFileset {}

class FileBundle<
    Axes extends string,
    Files extends Record<string, string>
> {
    output<T extends OutputFileTypes>(output_names: T): (
        generator: (arg: Record<Axes, string> & GetFile<Files, Axes> & GetFile<{[K in keyof T]: Axes}, Axes>) => string
    ) => FileBundle<Axes, { [K in keyof T]: Axes }> {
        return function(generator: (x: Record<Axes, string> & GetFile<Files, Axes> & GetFile<{[K in keyof T]: Axes}, Axes>) => string) {
            // TODO
            throw new Error("Not implemented");
        }
    }

    groupby<RmAxis extends Axes>(axis: RmAxis): FileBundle<Exclude<Axes, RmAxis>, Files> {
        //TODO
        throw new Error("Not implemented");
    }

    join<OtherAxes extends string, OtherFiles extends Record<string, string>>
        (other: FileBundle<OtherAxes, OtherFiles>
    ): FileBundle<Axes | OtherAxes, MergeFileMaps<Files, OtherFiles>> {
        //TODO
        throw new Error("Not implemented");
    }

    product<NewAxes extends string>(values: Record<NewAxes, string[]>): FileBundle<Axes | NewAxes, Files> {
        //TODO
        throw new Error("Not implemented");
    }

    recognize<T extends Record<string, string>, U extends string, V extends keyof Files>(
        file: V,
        searchpath: string,
        proc: (path: string, axes?: Record<Axes, string>) => [U, T] | false | undefined
    ): FileBundle<Axes | Extract<keyof T, string>, Omit<Files, V> & Record<U, Axes | Extract<keyof T, string>>> {
        //TODO
        throw new Error("Not implemented");
    }

    keep<T extends keyof Files>(name: T): OutputFileset {
        //TODO
        throw new Error("Not implemented");
    }

    //previewFileAxes<F extends keyof Files>(): Files[F] {
    //    //TODO
    //    throw new Error("Not implemented");
    //}
    //
    //previewAxes(): Axes {
    //    //TODO
    //    throw new Error("Not implemented");
    //}
    //
    //previewFiles(): keyof Files {
    //    //TODO
    //    throw new Error("Not implemented");
    //}
}

class WorkflowInput<T extends OutputFileTypes> extends FileBundle<never, { [K in keyof T]: never }> {
    input: OutputFileTypes;

    constructor(input: T) {
        super();
        this.input = input;
    }
}

let wf = new WorkflowInput({cramdir: "dir"}).recognize("cramdir", "*/*.cram", (x) => {
    return ["cram", {
        "chrom": x,
        "sample": x,
    }];
});

let vanilla = wf.product({chrom: ["1", "2", "3"]}).output({vcf: "file"})(
    x => `variant_caller --input ${x.cram} --region ${x.chrom} --output ${x.vcf}`
).groupby("chrom").output({"mergedVcf": "file"})(
    x => `bcftools concat ${x.vcf.join()} > ${x.mergedVcf}`
);

let chocolate = wf.product({chrom: ["1", "2", "3"]}).output({vcf: "file"})(
    x => `variant_caller --input ${x.cram} --region ${x.chrom} --output ${x.vcf} --other-flag`
).groupby("chrom").output({"mergedVcf2": "file"})(
    x => `bcftools concat ${x.vcf} > ${x.mergedVcf2}`
);

let step2 = vanilla.join(chocolate).output({vcfdiff: "file"})(
    x => `git diff ${x.mergedVcf} ${x.mergedVcf2} > ${x.vcfdiff}`
);

step2.keep("vcfdiff");


