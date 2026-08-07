// Source 2 Viewer 19.2.0.0 - https://valveresourceformat.github.io
// SPIR-V source (6728 bytes), HLSL reflection with SPIRV-Cross by KhronosGroup
// Static combos: S_PAINT_STYLE=3

static float4 _2;

cbuffer _Globals_ : register(b0, space1)
{
    int _Globals_1_bRoughnessMode : packoffset(c20);
    float _Globals_1_g_fWearSoftness : packoffset(c24);
    float3 _Globals_1_g_vColor0 : packoffset(c24.y);
    float _Globals_1_g_flColorBrightness : packoffset(c27.y);
    float _Globals_1_g_flPaintRoughness : packoffset(c28.w);
    float _Globals_1_g_flPearlescentScale : packoffset(c30.y);
    float _Globals_1_g_flWearAmount : packoffset(c32);
    float3 _Globals_1_g_vMetallicPaintAlbedoLevels : packoffset(c33);
};

Texture2D<float4> g_tAmbientOcclusion : register(t30, space1);
SamplerState g_sTrilinearClamp : register(s23, space1);
Texture2D<float4> g_tMasks : register(t31, space1);
Texture2D<float4> g_tWear : register(t38, space1);
SamplerState g_sTrilinearWrap : register(s22, space1);
Texture2D<float4> g_tGrunge : register(t39, space1);
Texture2D<float4> g_tMetalness : register(t35, space1);
Texture2D<float4> g_tColor : register(t34, space1);
Texture2D<float4> g_tGlitterNormal : register(t36, space1);

static float4 input_1;
static float4 input_2;
static float4 output_0;

struct PS_INPUT
{
    float4 input_1 : TEXCOORD1;
    float4 input_2 : TEXCOORD2;
};

struct PS_OUTPUT
{
    float4 output_0 : SV_Target0;
};

void MainPs_inner()
{
    float4 _18992 = g_tAmbientOcclusion.Sample(g_sTrilinearClamp, input_1.xy);
    float _4306 = _18992.x;
    float4 _18993 = g_tMasks.Sample(g_sTrilinearClamp, input_1.xy);
    float4 _20360 = g_tWear.Sample(g_sTrilinearWrap, input_2.xy);
    float _20385 = smoothstep(0.579999983310699462890625f - _Globals_1_g_fWearSoftness, 0.680000007152557373046875f + _Globals_1_g_fWearSoftness, (_18992.w + (_20360.x * _4306)) * ((_Globals_1_g_flWearAmount * 6.0f) + 1.0f));
    float _12663 = _18993.x;
    float _15212 = max(1.0f - _12663, _20385);
    float _4518 = (smoothstep(0.0f, 0.00999999977648258209228515625f, _20385) * (1.0f - (smoothstep(0.5f, 0.60000002384185791015625f, 1.0f) * smoothstep(1.0f, 0.89999997615814208984375f, 1.0f)))) * _12663;
    float4 _9437 = g_tGrunge.Sample(g_sTrilinearWrap, input_2.zw);
    float4 _16529 = lerp(1.0f.xxxx, _9437, ((pow(1.0f - _4306, 4.0f) * 0.25f) + (0.75f * _Globals_1_g_flWearAmount)).xxxx);
    float4 _7078;
    if (_Globals_1_bRoughnessMode != 0)
    {
        float4 _20322 = g_tMetalness.Sample(g_sTrilinearClamp, input_1.xy);
        float _6667 = 1.0f - _15212;
        float _22406 = lerp(_20322.x, min(1.0f, lerp(_Globals_1_g_flPaintRoughness, 0.3499999940395355224609375f, _4518) + ((1.0f - dot(_16529.xyz, float3(0.2125000059604644775390625f, 0.7153999805450439453125f, 0.07209999859333038330078125f))) * 0.20000000298023223876953125f)), max(0.0f, _6667));
        float _7177 = lerp(_12663, _20322.y, _15212);
        float4 _6640 = float4(_22406, _7177, _6667, min(1.0f, _Globals_1_g_flPearlescentScale));
        float3 _21659 = _6640.xyz;
        float3 _10597 = _21659 * 0.077399380505084991455078125f.xxx;
        float3 _9357 = pow((_21659 * 0.947867333889007568359375f.xxx) + 0.052132703363895416259765625f.xxx, 2.400000095367431640625f.xxx);
        float _23035;
        if (_22406 <= 0.040449999272823333740234375f)
        {
            _23035 = _10597.x;
        }
        else
        {
            _23035 = _9357.x;
        }
        float _23036;
        if (_7177 <= 0.040449999272823333740234375f)
        {
            _23036 = _10597.y;
        }
        else
        {
            _23036 = _9357.y;
        }
        float _19167;
        if (_6667 <= 0.040449999272823333740234375f)
        {
            _19167 = _10597.z;
        }
        else
        {
            _19167 = _9357.z;
        }
        _6640.x = _23035;
        _6640.y = _23036;
        _6640.z = _19167;
        _7078 = _6640;
    }
    else
    {
        _7078 = float4(input_1.xy, 0.0f, 1.0f);
    }
    float4 _22401;
    if (_Globals_1_bRoughnessMode == 0)
    {
        float3 _12553 = g_tColor.Sample(g_sTrilinearClamp, input_1.xy).xyz;
        float3 _13884 = _4518.xxx;
        float _20005 = lerp(_Globals_1_g_flColorBrightness, 1.0f, _4518);
        float3 _14061 = clamp(clamp(lerp(lerp(_12553, _Globals_1_g_vColor0.xyz, _12663.xxx), float3(0.37999999523162841796875f, 0.37000000476837158203125f, 0.3499999940395355224609375f), _13884) * _20005, 0.0f.xxx, 1.0f.xxx) * _20005, 0.0f.xxx, 1.0f.xxx);
        float3 _20049 = lerp(_16529.xyz, 1.0f.xxx, _13884);
        float4 _17842;
        _17842.x = _20049.x;
        _17842.y = _20049.y;
        _17842.z = _20049.z;
        float3 _21103 = _14061.xyz * _17842.xyz;
        float3 _21271 = normalize(max(0.0003000000142492353916168212890625f.xxx, _21103.xyz));
        float3 _24109 = lerp(lerp(_21103, ((_21271.xyz * lerp(min(_Globals_1_g_vMetallicPaintAlbedoLevels.x, dot(_14061.xyz, float3(0.2125000059604644775390625f, 0.7153999805450439453125f, 0.07209999859333038330078125f))), _Globals_1_g_vMetallicPaintAlbedoLevels.z, saturate(pow(max(_21103.x, max(_21103.y, _21103.z)), _Globals_1_g_vMetallicPaintAlbedoLevels.y)))) / max(_21271.x, max(_21271.y, _21271.z)).xxx).xyz, _Globals_1_g_flWearAmount.xxx), _12553, _15212.xxx);
        _22401 = float4(_24109, 1.0f);
    }
    else
    {
        _22401 = _7078;
    }
    float4 _3401 = g_tGlitterNormal.Sample(g_sTrilinearWrap, input_1.xy);
    float4 _6805;
    if (_3401.w < 0.0f)
    {
        float4 _23135 = _22401;
        _23135.x = _3401.x;
        _23135.y = _3401.y;
        _23135.z = _3401.z;
        _6805 = _23135;
    }
    else
    {
        _6805 = _22401;
    }
    output_0 = _6805;
}

PS_OUTPUT MainPs(PS_INPUT stage_input)
{
    input_1 = stage_input.input_1;
    input_2 = stage_input.input_2;
    MainPs_inner();
    PS_OUTPUT stage_output;
    stage_output.output_0 = output_0;
    return stage_output;
}

