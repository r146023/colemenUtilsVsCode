/**
 * Module to define the StringType Icon Component
 * @module StringType
 * @category Components
 * @subcategory Icons
 */

import { classNameFromSize, genClasses } from "colemengeneralutils/component/componentUtils";

import {ArrayMixedContents} from "colemengeneralutils/array/@array_types"
import {ColorString} from "colemengeneralutils/color/@color_types"
import Cryptadia from "colemengeneralutils/CryptadiaCore"
import IconStyleContainer from "colemencomponents/data_display/icons/IconStyleContainer";
import {NamedSizes} from "colemengeneralutils/theme/@theme_types"
import React from "react";
import {cssSizeString} from "colemengeneralutils/theme/@theme_types"

const ThemeManager = Cryptadia.ThemeManager

interface StringTypeProps {
    className?: string | string[] | ArrayMixedContents;

    /**
     * A connvenience property for setting the fill color of the icon, this will override the "fill" property in the
     * sx option.
     * @property {string|ColorString} color The fill color of the icon.
     */
    color?: string | ColorString;
    /**
     * How large the icon should be
     * @property {string} [size="max"]
     */
    size?: NamedSizes | "max";
    height?: cssSizeString;
    width?: cssSizeString;
    /**
     * The theme of the icon.
     * @type {string|undefined}
     * @default "default"
     */
    iconTheme?: "default" | "primary" | "secondary" | "info" | "warning" | "danger" | "none";

    /**
     * The CSS properties to apply to this icon on the Style property.
     * @property {React.CSSProperties} [sx={}]
     */
    sx?: React.CSSProperties;


    /**
     * The theme of the icon.
     * @property {string} [version="default"] The version of the stringType icon to use.
     */
    version?:'default'

    /**
       * The title to apply to this.
       * @property {string} [title="StringType"] The accessibility title to apply to the icon.
       */
    title?:string;

    /**
       * The description to use for accessibility
       * @property {string} [description="StringType"] The accessibility description to apply to the icon.
       * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-description
       */
    description?:string;
}


/**
 * The functional component used to generate the StringType Icon.
 *
 * @returns {JSX.Element}
 * @category Components
 * @subcategory Icons
 */
function StringTypeIcon(props: StringTypeProps): JSX.Element {
    var sizeClass = props.size !== "max" ? classNameFromSize(props.size) : "maxSize";
    var classes = ["StringType", "svgIcon", props.className, sizeClass, props.iconTheme ?? "default"];
    const title = props.title ?? "StringType";
    const description = props.description ?? "StringType";
    var version = props.version??"default";
    var sx = props.sx??{};
    if(typeof props.color === "string") sx['fill'] = props.color
    console.log("boobies");

    const genIcon=()=>{
        switch(version){
            case "default":
                return(
                    <svg viewBox="0 0 576.301 576.301"xmlns="http://www.w3.org/2000/svg" fill="inherit" role="img" aria-labelledby="StringTypeTitle" aria-describedby="StringTypeDescription">
                        <PathRow agod={agod} readOnly={false} title='Output Path' path={drawing.Settings.Path.output_path} onCopyClick={handleCopyDirClick} onOpenClick={handleOpenDirClick}/>
                        <title id='StringTypeTitle'>{title}</title>
                        <desc id='StringTypeDescription'>{description}</desc>
                        <path d="M260.1,303.449h58.65l-30.6-91.799L260.1,303.449z M492.15,204V84.15h-119.85L288.15,0L204,84.15H84.15V204L0,288.15
                            l84.15,84.151v119.85H204l84.15,84.15l84.151-84.15h119.85v-119.85l84.15-84.151L492.15,204z M346.801,390.15l-17.852-51H247.35
                            l-17.85,51h-48.45l81.6-229.5h51l81.6,229.5H346.801z"/>
                    </svg>
                )

        }
    }

    return (
        <IconStyleContainer className={genClasses(classes)} style={props.sx} $height={props.height} $width={props.width} theme={ThemeManager.theme}>
            {genIcon()}
        </IconStyleContainer>
    );
}

export default StringTypeIcon;
