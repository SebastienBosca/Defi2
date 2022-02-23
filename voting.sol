// SPDX-License-Identifier: MIT

// j'ai préféré calculer le ou les gagnants au fur et à mesure mais on peut aussi lancer un calcul avec une boucle type FOR à la fin.
// Winners est un tableau d'entiers car il peut y avoir plusieurs gagnants.

pragma solidity 0.8.11;
 
import "@openzeppelin/contracts/access/Ownable.sol";
 
contract Voting is Ownable {

struct Voter {
bool isRegistered;
bool hasVoted;
uint votedProposalId;
}
struct Proposal {
string description;
uint voteCount;
}


enum WorkflowStatus {
RegisteringVoters,
ProposalsRegistrationStarted,
ProposalsRegistrationEnded,
VotingSessionStarted,
VotingSessionEnded,
VotesTallied
}

WorkflowStatus public status = WorkflowStatus.RegisteringVoters ;

mapping (address => Voter) public profil; // mettre private si on ne veut pas que les votes soient publics, y compris ci-dessous.
Proposal[] public propositions;

event VoterRegistered(address voterAddress); 
event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
event ProposalRegistered(uint proposalId);
event Voted (address voter, uint proposalId);


uint NombreProp; 
uint Max;
uint[] private winners; //le gagnant ne s'affiche qu'à la fin, cependant le tableau public "propositions" et le mapping "profil" permettent à tout moment de connaître le nombre de voix d'une proposition; ce choix est évidemment discutable et modifiable.
uint[] public Winners;
address[] public RegVoters;


// Etape 0: l'administrateur (et lui seul) peut modifier le statut


function changeStatus(WorkflowStatus newStatus) public { // ou public onlyOwner { et on supprime la ligne suivante mais alors le message est celui specifie dans Ownable
    require (msg.sender == owner(), "only owner can change status"); 
    require ((uint(newStatus) == uint(status)+1 || uint(newStatus)+5 == uint(status)), "wrong step"); // les étapes doivent se suivre dans l'ordre
    WorkflowStatus previousStatus = status;
    if (newStatus == WorkflowStatus.RegisteringVoters) {
        NombreProp = 0;
        delete propositions;
        Max = 0;
        delete winners ;
        delete Winners ;
        for(uint i=0; i < RegVoters.length; i++){
        profil[RegVoters[i]].isRegistered=false;
        profil[RegVoters[i]].hasVoted=false;
        profil[RegVoters[i]].votedProposalId=0;
        
     } 
     delete RegVoters; // on efface tout
    }
    if (newStatus == WorkflowStatus.VotesTallied) {
        Winners = winners ; // on publie les résultats.
    }

    status = newStatus;
    emit WorkflowStatusChange(previousStatus, newStatus); 
}

// Etape 1: Enregistrement des votants

function Register(address voterAddress) public  { // ou public onlyOwner { et on supprime la ligne suivante
    require (msg.sender == owner(), "only owner can register voters");
    require (status == WorkflowStatus.RegisteringVoters , "this is no time for registering voters"); // heu on ne peut pas mettre d'accent dans les strings 
    profil[voterAddress].isRegistered = true;
    RegVoters.push(voterAddress);
    emit VoterRegistered(voterAddress);
}

// Etape 2: Enregistrement des Propositions 

function RegisterProposal(string memory prop) public {  
    require (profil[msg.sender].isRegistered == true, "you are not registered");
    require (status == WorkflowStatus.ProposalsRegistrationStarted , "this is no time for registering proposals");  
    ++ NombreProp ; 
    Proposal memory newProp = Proposal(prop , 0);
    propositions.push(newProp) ;
    emit ProposalRegistered(NombreProp);
}

// Etape 3: Fin de le session d'enregistrement des propositions 
// Rien à Faire

// Etape 4: Votes

function RegisterVote(uint PropId) public {
    require (profil[msg.sender].isRegistered == true, "you are not registered");
    require (status == WorkflowStatus.VotingSessionStarted , "this is no time for vote");  
    require (profil[msg.sender].hasVoted == false, "you have already voted");
    ++propositions[PropId-1].voteCount;  
    if (propositions[PropId-1].voteCount == Max) {
    winners.push(PropId) ;
    }
    if (propositions[PropId-1].voteCount > Max) {
    delete winners ;  
    Max = propositions[PropId-1].voteCount ;
    winners.push(PropId) ;
    }
    profil[msg.sender].hasVoted = true;
    profil[msg.sender].votedProposalId = PropId ;
    emit Voted(msg.sender , PropId);

}

// Etape 5: Fin de la session de vote
// Rien à Faire

// Etape 6: Comptabilisation des votes et publication du ou des gagnants

function getWinner() public view returns (uint[] memory) {  
    require (status == WorkflowStatus.VotesTallied , "this is no time for getting winner");  
    return Winners ;  // le tableau public de propositions permet à tous de vérifier les détails de la ou des propositions gagnantes: string associé, nombre de votes.
}

}

