

function get_Conclusion(projectInfo) {
    //if(projectInfo['ProjectType']=="Hourly") return false;
    if(projectInfo['PlanBid']!="Good") return false;

    if (typeof projectInfo['CategoryName'] !== "string" || projectInfo['CategoryName'].trim() === "") {
        return false;
    }
    const categoryScore = Number(projectInfo['CategoryScore']);
    if (!Number.isFinite(categoryScore) || categoryScore < 0) {
        return false;
    }
    return true;
}

export default (projectInfo) => {

    projectInfo['Conclusion'] = get_Conclusion(projectInfo);
    console.log(
        'Conclusion:',
        projectInfo['Conclusion'],
        '| PlanBid:',
        projectInfo['PlanBid'],
        '| CategoryName:',
        projectInfo['CategoryName'],
        '| CategoryScore:',
        projectInfo['CategoryScore'],
        '| seo_url:',
        projectInfo['seo_url'] ?? projectInfo['href']
    );

    return projectInfo;
}
