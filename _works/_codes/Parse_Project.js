// Parse_Project.js
export default (projectInfo) => {
    for (const key in projectInfo) {
        const value = projectInfo[key];

        if (value === "Yes") {
            projectInfo[key] = true;
        } else if (value === "No") {
            projectInfo[key] = false;
        } else if (
            typeof value === "string" &&
            value.trim() !== "" &&             
            !isNaN(value) &&                   
            /^[+-]?\d+(\.\d+)?$/.test(value)   
        ) {
            projectInfo[key] = Number(value);
        }
    }
    return projectInfo;
};


/**
 const input = {
    a: "Yes",
    b: "No",
    c: "42",
    d: "3.14",
    e: "  ",
    f: "",
    g: "123abc",
    h: null,
    i: undefined,
    j: true,
    k: false,
    l: "+10",
    m: "-7.2"
  };
  
  console.log(transformProjectInfo(input));
  
 {
  a: true,
  b: false,
  c: 42,
  d: 3.14,
  e: "  ",
  f: "",
  g: "123abc",
  h: null,
  i: undefined,
  j: true,
  k: false,
  l: 10,
  m: -7.2
}

 */
