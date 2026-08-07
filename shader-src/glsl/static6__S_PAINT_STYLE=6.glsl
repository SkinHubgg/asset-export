// Source 2 Viewer 19.2.0.0 - https://valveresourceformat.github.io
// SPIR-V source (6480 bytes), HLSL reflection with SPIRV-Cross by KhronosGroup
// Static combos: S_PAINT_STYLE=6

cbuffer _Globals_ : register(b0, space1)
{
    int _Globals_1_bRoughnessMode : packoffset(c20);
    float _Globals_1_g_fWearSoftness : packoffset(c24);
    float _Globals_1_g_flColorBrightness : packoffset(c27.y);
    float _Globals_1_g_flPaintRoughness : packoffset(c28.w);
    float _Globals_1_g_flPearlescentScale : packoffset(c30.y);
    float _Globals_1_g_flPaintMetalness : packoffset(c30.w);
    float _Globals_1_g_flWearAmount : packoffset(c32);
    float3 _Globals_1_g_vPaintAlbedoLevels : packoffset(c32.y);
    float3 _Globals_1_g_vMetallicPaintAlbedoLevels : packoffset(c33);
};

Texture2D<float4> g_tAmbientOcclusion : register(t30, space1);
SamplerState g_sTrilinearClamp : register(s23, space1);
Texture2D<float4> g_tWear : register(t38, space1);
SamplerState g_sTrilinearWrap : register(s22, space1);
Texture2D<float4> g_tPattern : register(t37, space1);
SamplerState AddressU_dynamic_AddressV_dynamic : register(s27, space1);
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
    float4 _19372 = g_tAmbientOcclusion.Sample(g_sTrilinearClamp, input_1.xy);
    float _4306 = _19372.x;
    float4 _19334 = g_tWear.Sample(g_sTrilinearWrap, input_2.xy);
    float4 _11288 = g_tPattern.Sample(AddressU_dynamic_AddressV_dynamic, input_1.zw);
    float _19155 = _11288.w;
    float _17710 = max(0.0f, smoothstep(0.0f, 0.5f, _19155));
    float _4693 = _Globals_1_g_fWearSoftness * _17710;
    float _22167 = smoothstep(0.579999983310699462890625f - _4693, 0.680000007152557373046875f + _4693, (((_19372.w + (_19334.x * _4306)) * ((_Globals_1_g_flWearAmount * 6.0f) + 1.0f)) + (smoothstep(0.5f, 0.60000002384185791015625f, _19155) * smoothstep(1.0f, 0.89999997615814208984375f, _19155))) * _17710);
    float4 _9437 = g_tGrunge.Sample(g_sTrilinearWrap, input_2.zw);
    float4 _16529 = lerp(1.0f.xxxx, _9437, ((pow(1.0f - _4306, 4.0f) * 0.25f) + (0.75f * _Globals_1_g_flWearAmount)).xxxx);
    float4 _7078;
    if (_Globals_1_bRoughnessMode != 0)
    {
        float4 _19391 = g_tMetalness.Sample(g_sTrilinearClamp, input_1.xy);
        _19391.x = _19391.x;
        float4 _14119 = lerp(float4(min(1.0f, _Globals_1_g_flPaintRoughness + ((((1.0f - _16529.w) * _Globals_1_g_flWearAmount) * _Globals_1_g_flWearAmount) * 0.5f)), _Globals_1_g_flPaintMetalness, 0.0f, 1.0f), _19391, _22167.xxxx);
        float _10938 = 1.0f - _22167;
        float4 _13018 = _14119;
        _13018.z = _10938;
        float3 _18043 = _13018.xyz * 0.077399380505084991455078125f.xxx;
        float3 _7676 = pow((_13018.xyz * 0.947867333889007568359375f.xxx) + 0.052132703363895416259765625f.xxx, 2.400000095367431640625f.xxx);
        float _21354;
        if (_14119.x <= 0.040449999272823333740234375f)
        {
            _21354 = _18043.x;
        }
        else
        {
            _21354 = _7676.x;
        }
        float _23035;
        if (_14119.y <= 0.040449999272823333740234375f)
        {
            _23035 = _18043.y;
        }
        else
        {
            _23035 = _7676.y;
        }
        float _19513;
        if (_10938 <= 0.040449999272823333740234375f)
        {
            _19513 = _18043.z;
        }
        else
        {
            _19513 = _7676.z;
        }
        float4 _17156 = float4(_21354, _23035, _10938, min(1.0f, _Globals_1_g_flPearlescentScale));
        _17156.z = _19513;
        _7078 = _17156;
    }
    else
    {
        _7078 = float4(input_1.xy, 0.0f, 1.0f);
    }
    float4 _22401;
    if (_Globals_1_bRoughnessMode == 0)
    {
        float3 _19076 = clamp(_11288.xyz * _Globals_1_g_flColorBrightness, 0.0f.xxx, 1.0f.xxx);
        float3 _21103 = _19076.xyz * _16529.xyz;
        float3 _21271 = normalize(max(0.0003000000142492353916168212890625f.xxx, _21103.xyz));
        float3 _23898 = lerp(_Globals_1_g_vPaintAlbedoLevels.xyz, _Globals_1_g_vMetallicPaintAlbedoLevels.xyz, _Globals_1_g_flPaintMetalness.xxx);
        _22401 = float4(lerp(lerp(_21103, ((_21271.xyz * lerp(min(_23898.x, dot(_19076.xyz, float3(0.2125000059604644775390625f, 0.7153999805450439453125f, 0.07209999859333038330078125f))), _23898.z, saturate(pow(max(_21103.x, max(_21103.y, _21103.z)), _23898.y)))) / max(_21271.x, max(_21271.y, _21271.z)).xxx).xyz, _Globals_1_g_flWearAmount.xxx), g_tColor.Sample(g_sTrilinearClamp, input_1.xy).xyz, _22167.xxx), 1.0f);
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

