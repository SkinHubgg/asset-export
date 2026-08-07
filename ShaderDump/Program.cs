// Dumps the REAL decompiled GLSL for a Source 2 shader.
//
// Why this exists: the Source2Viewer CLI only emits a shader's *interface* (the reconstructed
// .vfx — declarations, no code). The actual arithmetic is recoverable only from the VULKAN
// variant, whose SPIR-V ValveResourceFormat runs through SPIRV-Cross. That path lives in the
// library and the GUI, not the CLI, so this is a ~30-line wrapper around it.
//
// Usage:
//   dotnet run --project ShaderDump -- <file.vcs> [outDir] [maxCombos]
//
// With no combo limit it prints how many static combos exist and dumps the first few; the
// compositor has one per feature permutation (paint style, roughness mode, overlay, ...), so
// dumping all of them is rarely what you want.

using ValveResourceFormat.CompiledShader;

if (args.Length < 1)
{
    Console.Error.WriteLine("usage: ShaderDump <file.vcs> [outDir] [maxCombos]");
    return 1;
}

var path = args[0];
var outDir = args.Length > 1 ? args[1] : Path.Combine(Path.GetDirectoryName(path) ?? ".", "glsl");
// Third arg is either a combo COUNT ("dump the first N") or an explicit comma-separated list of
// static-combo IDs ("dump exactly these"). The list form is what you want when you already know the
// combo you need — the id is a mixed-radix number over the S_ combos, so e.g. style 6 + overlay is
// 6 + 576.
var wanted = args.Length > 2 && args[2].Contains(',')
    ? args[2].Split(',').Select(long.Parse).ToHashSet()
    : null;
var maxCombos = wanted is not null
    ? wanted.Count
    : args.Length > 2 && int.TryParse(args[2], out var m) ? m : 4;

if (!File.Exists(path))
{
    Console.Error.WriteLine($"not found: {path}");
    return 1;
}

Directory.CreateDirectory(outDir);

using var shader = new VfxProgramData();
shader.Read(path);

var name = Path.GetFileNameWithoutExtension(path);
Console.WriteLine($"{name}");
Console.WriteLine($"  vcs version   : {shader.VcsVersion}");
Console.WriteLine($"  program type  : {shader.VcsProgramType}");
Console.WriteLine($"  static combos : {shader.StaticComboEntries.Count}");

var written = 0;
var failed = 0;

foreach (var (comboId, _) in shader.StaticComboEntries)
{
    if (written >= maxCombos)
    {
        break;
    }

    if (wanted is not null && !wanted.Contains(comboId))
    {
        continue;
    }

    try
    {
        var staticCombo = shader.GetStaticCombo(comboId);
        if (staticCombo.DynamicCombos.Length == 0)
        {
            continue;
        }

        // Dynamic combo 0 is enough: dynamic combos vary lighting/runtime paths, not the
        // compositing arithmetic we are after.
        var dynamicCombo = staticCombo.DynamicCombos[0];
        var code = staticCombo.ShaderFiles[dynamicCombo.ShaderFileId].GetDecompiledFile();

        var outPath = Path.Combine(outDir, $"{name}.static{comboId}.glsl");
        File.WriteAllText(outPath, code);
        Console.WriteLine($"  wrote {Path.GetFileName(outPath)}  ({code.Length / 1024} KB, {code.Split('\n').Length} lines)");
        written++;
    }
    catch (Exception ex)
    {
        failed++;
        if (failed <= 3)
        {
            Console.WriteLine($"  combo {comboId} failed: {ex.GetType().Name}: {ex.Message}");
        }
    }
}

Console.WriteLine($"done: {written} written, {failed} failed -> {outDir}");
return 0;
