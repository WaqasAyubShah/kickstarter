pragma solidity ^0.4.17;

contract Factory{

    address[] public deployCompaign;

    function createCompaign(uint256 min) public {
        address newCompaign = new Compaign(min, msg.sender);                   //asign a the mint function here, so that user can mint .
        deployCompaign.push(newCompaign);                            // Add new token to the list
    }
    function getDeployedCompaign() public view returns(address[]){
        return deployCompaign;
    }

}

contract Compaign {
    struct Request{
        string description;
        uint value;
        address recipient;
        bool complete;
        uint approvalCount;
        mapping(address => bool) approvals;
    }

    Request[] public requests;
    address public creator;
    uint public minimumContribution;
    mapping(address => bool) public approvers;
    uint public totalApprovers;
    uint public totalContributionl;

    modifier restricted() {
        require(msg.sender ==  creator);
        _;
    }

    function Compaign(uint minimum,address createnew) public{
        creator = createnew;
        minimumContribution = minimum;
    }


    function contribute() public payable{
        require(msg.value > minimumContribution );
        approvers[msg.sender] = true;
        totalApprovers++;
        totalContributionl += msg.value;
    }

    function createRequest(string description, uint value, address recipient)
        public restricted
        {
        Request memory newRequest = Request({
            description : description,
            value : value,
            recipient : recipient,
            complete : false,
            approvalCount : 0
        });
        requests.push(newRequest);
        }
    function approveRequest(uint index) public{
        Request storage thisRequest = requests[index];

        require(approvers[msg.sender]);
        require(!thisRequest.approvals[msg.sender]);

        thisRequest.approvals[msg.sender] = true;
        thisRequest.approvalCount++;
    }

    function finalizeRequest(uint index) public restricted {
        Request storage myRequest = requests[index];
        require(myRequest.approvalCount > (totalApprovers/2));
        require(!myRequest.complete);
        myRequest.recipient.transfer(myRequest.value);
        myRequest.complete = true;
    }
}
